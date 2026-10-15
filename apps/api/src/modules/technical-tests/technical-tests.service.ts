import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, type TechnicalTest } from "@prisma/client";
import { ROLE_TO_TRACK } from "../../common/constants";
import { QuotaExceededException } from "../../common/errors";
import { getMonthWindow, lockedTransaction, userLockKey } from "../../common/plan";
import { PrismaService } from "../../common/prisma.service";
import { normalizeTags } from "../../common/tech-tags";
import { AiService } from "../ai/ai.service";
import { AiScenarioGeneratorService } from "../ai/ai-scenario-generator.service";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { generateScenario } from "./engine/scenario-generator";
import { evaluateSubmission } from "./engine/self-check";
import type { CreateTechnicalTestDto, SelfReviewTechnicalTestDto } from "./technical-tests.dto";
import {
  TEST_STATUS,
  SUBMITTABLE_STATUSES,
  aiReviewState,
  buildSelfReview,
  canSubmit,
  isSubmitted,
  readEvaluation,
  readScenario,
  shouldTryAiScenario,
  suggestedMinutes,
  toJson,
} from "./technical-tests.rules";
import type {
  ScenarioCore,
  StoredEvaluation,
  StoredScenario,
  TechTestAiReview,
  TechnicalTestSummary,
  TechnicalTestView,
} from "./technical-tests.types";
import { toSummary, toTestView, type TechnicalTestSummaryRow } from "./technical-tests.view";

/** GET /technical-tests returns at most this many summaries, newest first. */
const MAX_TEST_SUMMARIES = 100;
/** How many recent tests' templates are de-prioritised for the next one. */
const RECENT_TEMPLATE_LOOKBACK = 3;

type Db = Prisma.TransactionClient | PrismaService;

@Injectable()
export class TechnicalTestsService {
  private readonly logger = new Logger(TechnicalTestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly aiScenarios: AiScenarioGeneratorService,
    private readonly ai: AiService,
  ) {}

  /** Newest first, soft-deleted excluded; no scenario, submission or review text loaded. */
  async listSummaries(userId: string): Promise<TechnicalTestSummary[]> {
    const rows = await this.prisma.$queryRaw<TechnicalTestSummaryRow[]>`
      SELECT "id", "title", "track", "level", "difficulty", "roleFocus", "tags", "timeLimit",
             "status", "createdAt", "startedAt", "submittedAt",
             CASE WHEN jsonb_typeof("evaluation"->'percentage') = 'number'
                  THEN ("evaluation"->>'percentage')::float8 END AS "score",
             CASE WHEN jsonb_typeof("evaluation"->'grade') = 'string'
                  THEN "evaluation"->>'grade' END AS "grade",
             COALESCE(jsonb_typeof("evaluation"->'aiReview') = 'object', false) AS "hasAiReview"
      FROM "TechnicalTest"
      WHERE "userId" = ${userId} AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
      LIMIT ${MAX_TEST_SUMMARIES}`;
    return rows.map(toSummary);
  }

  async getTest(userId: string, testId: string): Promise<TechnicalTestView> {
    return toTestView(await this.findOwned(this.prisma, userId, testId));
  }

  /**
   * Free users: monthly quota checked before any work and again atomically at
   * insert; their scenarios always come from the static engine. Premium users
   * may get an AI scenario (never inside the transaction); the AI generator
   * returns null on any limit or failure, which keeps the template scenario.
   */
  async createTest(userId: string, dto: CreateTechnicalTestDto): Promise<TechnicalTestView> {
    const { tags } = normalizeTags(dto.tags);
    const plan = await this.entitlements.getPlan(userId);
    const monthlyLimit = plan.limits.monthlyTechTests;
    if (monthlyLimit !== null) {
      await this.assertMonthlyQuota(this.prisma, userId, monthlyLimit);
    }

    const input = { roleFocus: dto.roleFocus, level: dto.level, difficulty: dto.difficulty, tags };
    const generated = generateScenario(input, {
      recentTemplateIds: await this.recentTemplateIds(userId),
    });
    let scenario: StoredScenario = {
      ...generated.scenario,
      source: "template",
      templateId: generated.templateId,
    };

    const tryAi = shouldTryAiScenario({
      isPremium: plan.isPremium,
      tagCount: tags.length,
      tagMatches: generated.tagMatches,
      roll: Math.random(),
    });
    if (tryAi) {
      const aiScenario = await this.aiScenarios.generateScenario(input, userId);
      if (aiScenario) scenario = { ...aiScenario, source: "ai" };
    }

    const data: Prisma.TechnicalTestUncheckedCreateInput = {
      userId,
      title: scenario.title,
      track: ROLE_TO_TRACK[dto.roleFocus] ?? "fullstack",
      level: dto.level,
      difficulty: dto.difficulty,
      roleFocus: dto.roleFocus,
      tags,
      timeLimit: suggestedMinutes(scenario.estimatedTime),
      scenario: toJson(scenario),
      status: TEST_STATUS.notStarted,
    };

    if (monthlyLimit === null) {
      return toTestView(await this.prisma.technicalTest.create({ data }));
    }
    const created = await lockedTransaction(this.prisma, this.lockKey(userId), async (tx) => {
      await this.assertMonthlyQuota(tx, userId, monthlyLimit);
      return tx.technicalTest.create({ data });
    });
    return toTestView(created);
  }

  /** not_started → in_progress. Starting an in-progress test is a no-op; a submitted one is 409. */
  async startTest(userId: string, testId: string): Promise<TechnicalTestView> {
    await this.prisma.technicalTest.updateMany({
      where: { id: testId, userId, deletedAt: null, status: TEST_STATUS.notStarted },
      data: { status: TEST_STATUS.inProgress, startedAt: new Date() },
    });
    const test = await this.findOwned(this.prisma, userId, testId);
    if (isSubmitted(test.status)) {
      throw new ConflictException("This test has already been submitted.");
    }
    return toTestView(test);
  }

  /** Stores the solution and its automated checklist. Exactly once: re-submits are 409. */
  async submitTest(
    userId: string,
    testId: string,
    submission: string,
  ): Promise<TechnicalTestView> {
    if (!submission.trim()) {
      throw new BadRequestException("Your submission is empty.");
    }
    const test = await this.findOwned(this.prisma, userId, testId);
    if (!canSubmit(test.status)) {
      throw new ConflictException("This test has already been submitted.");
    }
    const evaluation = evaluateSubmission(submission, this.requireScenario(test));
    const now = new Date();

    // Guarded on status so concurrent submits can't overwrite each other.
    const { count } = await this.prisma.technicalTest.updateMany({
      where: { id: testId, userId, deletedAt: null, status: { in: SUBMITTABLE_STATUSES } },
      data: {
        status: TEST_STATUS.submitted,
        submission,
        submittedAt: now,
        startedAt: test.startedAt ?? now,
        evaluation: toJson(evaluation),
      },
    });
    const updated = await this.findOwned(this.prisma, userId, testId);
    if (count === 0) {
      throw new ConflictException("This test has already been submitted.");
    }
    return toTestView(updated);
  }

  /** Free rubric self-rating of a submitted test; may be updated any time. */
  async saveSelfReview(
    userId: string,
    testId: string,
    dto: SelfReviewTechnicalTestDto,
  ): Promise<TechnicalTestView> {
    return lockedTransaction(this.prisma, this.lockKey(userId), async (tx) => {
      const test = await this.findOwned(tx, userId, testId);
      if (!isSubmitted(test.status)) {
        throw new ConflictException("Submit your solution before reviewing it.");
      }
      const scenario = this.requireScenario(test);
      const selfReview = buildSelfReview(dto, scenario.evaluationCriteria.length);
      const evaluation = this.currentEvaluation(test, scenario);
      return toTestView(await this.writeEvaluation(tx, test.id, { ...evaluation, selfReview }));
    });
  }

  /**
   * Premium AI review of a submitted test, once per test. A claim stored on
   * the evaluation (under the per-user lock) stops double requests from
   * paying twice; it is released if the AI call fails so the user can retry.
   */
  async requestAiReview(userId: string, testId: string): Promise<TechnicalTestView> {
    await this.entitlements.assertPremium(userId, "aiTechReview");
    const { test, scenario } = await this.claimAiReview(userId, testId);

    let review: TechTestAiReview;
    try {
      const result = await this.ai.reviewTechTestSubmission(userId, {
        title: scenario.title,
        brief: scenario.brief,
        requirements: scenario.requirements.map((r) => r.text),
        evaluationCriteria: scenario.evaluationCriteria.map((c) => c.name),
        level: test.level,
        submission: test.submission ?? "",
      });
      review = { ...result, reviewedAt: new Date().toISOString() };
    } catch (error) {
      await this.releaseAiReviewClaim(userId, testId);
      throw error;
    }

    return lockedTransaction(this.prisma, this.lockKey(userId), async (tx) => {
      const current = await this.findOwned(tx, userId, testId);
      const { aiReviewPendingSince: _claim, ...evaluation } = this.currentEvaluation(
        current,
        scenario,
      );
      // Never replace a review that is already stored.
      const aiReview = evaluation.aiReview ?? review;
      return toTestView(await this.writeEvaluation(tx, current.id, { ...evaluation, aiReview }));
    });
  }

  /**
   * Soft delete: hidden everywhere but still counted toward the monthly free
   * allowance. The user's solution and reviews are erased. Runs under the
   * user lock so a concurrent review write can't put the evaluation back.
   */
  async deleteTest(userId: string, testId: string): Promise<void> {
    const { count } = await lockedTransaction(this.prisma, this.lockKey(userId), (tx) =>
      tx.technicalTest.updateMany({
        where: { id: testId, userId, deletedAt: null },
        data: { deletedAt: new Date(), submission: null, evaluation: Prisma.DbNull },
      }),
    );
    if (count === 0) throw new NotFoundException("Technical test not found");
  }

  /* ── Internals ──────────────────────────────────────────────────── */

  private lockKey(userId: string): string {
    return userLockKey("tech-test", userId);
  }

  private async findOwned(db: Db, userId: string, testId: string): Promise<TechnicalTest> {
    const test = await db.technicalTest.findFirst({
      where: { id: testId, userId, deletedAt: null },
    });
    if (!test) throw new NotFoundException("Technical test not found");
    return test;
  }

  /** Counts every test created this month, including deleted ones. */
  private async assertMonthlyQuota(db: Db, userId: string, limit: number): Promise<void> {
    const { start, nextStart } = getMonthWindow();
    const used = await db.technicalTest.count({
      where: { userId, createdAt: { gte: start } },
    });
    if (used >= limit) {
      throw new QuotaExceededException("techTests", limit, used, nextStart);
    }
  }

  /** Template ids of the user's latest tests (deleted included), newest first. */
  private async recentTemplateIds(userId: string): Promise<(string | null)[]> {
    const rows = await this.prisma.$queryRaw<{ templateId: string | null }[]>`
      SELECT "scenario"->>'templateId' AS "templateId"
      FROM "TechnicalTest"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
      LIMIT ${RECENT_TEMPLATE_LOOKBACK}`;
    return rows.map((row) => row.templateId);
  }

  private requireScenario(test: TechnicalTest): ScenarioCore {
    const scenario = readScenario(test.scenario);
    if (!scenario) {
      this.logger.error(`Technical test ${test.id} has a malformed scenario`);
      throw new InternalServerErrorException(
        "This test's brief couldn't be read. Please generate a new test.",
      );
    }
    return scenario;
  }

  /** The stored evaluation, or a fresh checklist for legacy submissions saved without one. */
  private currentEvaluation(test: TechnicalTest, scenario: ScenarioCore): StoredEvaluation {
    return readEvaluation(test.evaluation) ?? evaluateSubmission(test.submission ?? "", scenario);
  }

  private writeEvaluation(
    tx: Prisma.TransactionClient,
    testId: string,
    evaluation: StoredEvaluation,
  ): Promise<TechnicalTest> {
    return tx.technicalTest.update({
      where: { id: testId },
      data: { evaluation: toJson(evaluation) },
    });
  }

  private claimAiReview(
    userId: string,
    testId: string,
  ): Promise<{ test: TechnicalTest; scenario: ScenarioCore }> {
    return lockedTransaction(this.prisma, this.lockKey(userId), async (tx) => {
      const test = await this.findOwned(tx, userId, testId);
      if (!isSubmitted(test.status)) {
        throw new ConflictException("Submit your solution before requesting an AI review.");
      }
      const scenario = this.requireScenario(test);
      const evaluation = this.currentEvaluation(test, scenario);
      const now = new Date();
      const state = aiReviewState(evaluation, now);
      if (state === "done") {
        throw new ConflictException("This test already has an AI review.");
      }
      if (state === "pending") {
        throw new ConflictException("An AI review of this test is already in progress.");
      }
      await this.writeEvaluation(tx, test.id, {
        ...evaluation,
        aiReviewPendingSince: now.toISOString(),
      });
      return { test, scenario };
    });
  }

  /** Best effort: an unreleased claim simply expires (AI_REVIEW_CLAIM_TTL_MS). */
  private async releaseAiReviewClaim(userId: string, testId: string): Promise<void> {
    try {
      await lockedTransaction(this.prisma, this.lockKey(userId), async (tx) => {
        const test = await tx.technicalTest.findFirst({
          where: { id: testId, userId, deletedAt: null },
        });
        const evaluation = test ? readEvaluation(test.evaluation) : null;
        if (!test || !evaluation?.aiReviewPendingSince) return;
        const { aiReviewPendingSince: _claim, ...rest } = evaluation;
        await this.writeEvaluation(tx, test.id, rest);
      });
    } catch (error) {
      const name = error instanceof Error ? error.name : "unknown error";
      this.logger.warn(`Could not release an AI review claim (${name})`);
    }
  }
}
