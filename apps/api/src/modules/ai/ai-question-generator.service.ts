import { ConflictException, Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import {
  AI_BACKGROUND_BUDGET,
  AI_GENERATION_COOLDOWN_MS,
  AI_MAX_USER_DAILY_GENERATIONS,
  AI_PIGGYBACK_CHANCE,
  AI_QUESTION_BATCH_SIZE,
  AI_URGENT_COOLDOWN_MS,
  DIFFICULTY_MAP,
  DIFFICULTY_RANGES,
} from "../../common/constants";
import { DAY_MS, lockedTransaction } from "../../common/plan";
import { expandTagAliases } from "../../common/tech-tags";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { AiModelConfig } from "./ai-models";
import { AiRunner } from "./ai-runner";
import type {
  PoolFillResult,
  PoolFillSkipReason,
  QuestionGenerationFilters,
} from "./ai.types";
import {
  QUESTION_TRACKS,
  allowedQuestionTypes,
  buildQuestionBatchPrompt,
  normaliseQuestionFilters,
  promptKey,
  questionBatchSchema,
  validateGeneratedQuestions,
  type NormalisedQuestionFilters,
  type ValidatedQuestion,
} from "./prompts/questions.prompts";

export type { PoolFillResult, QuestionGenerationFilters } from "./ai.types";

/** Pool size the background job and piggyback fill tag-free combos up to. */
const TARGET_POOL_SIZE = 30;
/** Generations of any trigger in a trailing 24h window, across all users. */
const GLOBAL_DAILY_GENERATION_BUDGET = 150;
/** Smallest batch worth a call. */
const MIN_BATCH_SIZE = 4;
/** Upper bound on the question count a caller may ask the pool to reach. */
const MAX_WANTED = 30;
/** One global lock: reservations are rare and short, so every cap stays exact. */
const RESERVATION_LOCK_KEY = "qgen:reserve";
const SYSTEM_TRIGGER = "system";

const BACKGROUND_FILL_COMBOS: NormalisedQuestionFilters[] = QUESTION_TRACKS.flatMap(
  (track) =>
    ["junior", "mid", "senior"].flatMap((level) =>
      ["easy", "medium", "hard"].map((difficulty) => ({
        track,
        level,
        difficulty,
        tags: [],
      })),
    ),
);

interface GenerationOptions {
  triggeredBy: string;
  cooldownMs: number;
  batchSize: number;
  model: string;
}

type Reservation = { logId: string } | { skipped: PoolFillSkipReason };

/**
 * Grows the shared interview question bank with AI-written questions.
 *
 * Every generation first takes a reservation: a QuestionGenerationLog row
 * (questionsGenerated 0) inserted under a lock after re-checking the per-combo
 * cooldown, the per-user daily cap and a global daily budget. The OpenAI call
 * runs outside any transaction; the row is kept when it fails, so failures
 * count toward every cap. Free users never trigger generation.
 */
@Injectable()
export class AiQuestionGeneratorService {
  private readonly logger = new Logger(AiQuestionGeneratorService.name);
  private backgroundFillRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly runner: AiRunner,
    private readonly models: AiModelConfig,
    private readonly entitlements: EntitlementsService,
  ) {}

  /** Stable hash of a filter combination (canonical tags, order-insensitive). */
  computeFilterHash(filters: QuestionGenerationFilters): string {
    const normalised = normaliseQuestionFilters(filters);
    return hashFilters(
      normalised ?? { ...filters, tags: [] },
      normalised?.tags.map((tag) => tag.id) ?? [],
    );
  }

  /** Questions in the bank matching the filters (0 for unknown track/level/difficulty). */
  async getPoolSize(filters: QuestionGenerationFilters): Promise<number> {
    const normalised = normaliseQuestionFilters(filters);
    return normalised ? this.countPool(normalised) : 0;
  }

  /**
   * Premium-only, on-request fill: when the pool for these filters has fewer
   * than `wanted` questions, generate one bounded batch (4-8 questions). Free
   * users are skipped. Never throws; the result says what happened.
   */
  async ensurePoolForUser(
    userId: string,
    filters: QuestionGenerationFilters,
    wanted: number,
  ): Promise<PoolFillResult> {
    try {
      const normalised = normaliseQuestionFilters(filters);
      if (!normalised) return skipped("invalid_filters");

      const plan = await this.entitlements.getPlan(userId);
      if (!plan.isPremium) return skipped("not_premium");

      const target = Number.isFinite(wanted)
        ? Math.min(MAX_WANTED, Math.max(1, Math.floor(wanted)))
        : AI_QUESTION_BATCH_SIZE;
      const poolSize = await this.countPool(normalised);
      if (poolSize >= target) return skipped("pool_sufficient");

      return await this.generate(normalised, {
        triggeredBy: userId,
        cooldownMs: AI_URGENT_COOLDOWN_MS,
        batchSize: Math.min(
          AI_QUESTION_BATCH_SIZE,
          Math.max(MIN_BATCH_SIZE, target - poolSize),
        ),
        model: this.models.modelFor(plan.modelTier),
      });
    } catch (error) {
      this.logger.warn(`Pool fill failed: ${describeError(error)}`);
      return skipped("failed");
    }
  }

  /**
   * After a premium session completes, occasionally top up the TAG-FREE pool
   * for its track/level/difficulty (user-chosen tags never drive system
   * generation). Runs as "system" on the light model. Never throws.
   */
  async maybePiggybackGenerate(
    filters: Pick<QuestionGenerationFilters, "track" | "level" | "difficulty">,
  ): Promise<void> {
    if (Math.random() > AI_PIGGYBACK_CHANCE) return;
    try {
      const normalised = normaliseQuestionFilters({ ...filters, tags: [] });
      if (!normalised) return;
      if ((await this.countPool(normalised)) >= TARGET_POOL_SIZE) return;
      await this.generate(normalised, this.systemOptions());
    } catch (error) {
      this.logger.warn(`Piggyback generation failed: ${describeError(error)}`);
    }
  }

  /**
   * Fill the thinnest tag-free combos (up to AI_BACKGROUND_BUDGET generation
   * attempts per run). One run at a time per instance; across instances the
   * per-combo cooldown prevents duplicate generation.
   */
  async backgroundFill(): Promise<{
    combosProcessed: number;
    questionsGenerated: number;
  }> {
    if (this.backgroundFillRunning) {
      throw new ConflictException("A background fill is already running.");
    }
    this.backgroundFillRunning = true;
    try {
      const sizes = await this.tagFreePoolSizes();
      const thinnest = BACKGROUND_FILL_COMBOS.map((combo) => ({
        combo,
        size: sizes.get(comboKey(combo)) ?? 0,
      }))
        .filter(({ size }) => size < TARGET_POOL_SIZE)
        .sort((a, b) => a.size - b.size);

      let combosProcessed = 0;
      let questionsGenerated = 0;
      for (const { combo } of thinnest) {
        if (combosProcessed >= AI_BACKGROUND_BUDGET) break;
        const result = await this.generate(combo, this.systemOptions());
        if (result.skipped === "global_daily_budget") break;
        if (result.skipped === null || result.skipped === "failed") combosProcessed++;
        questionsGenerated += result.generated;
      }
      return { combosProcessed, questionsGenerated };
    } finally {
      this.backgroundFillRunning = false;
    }
  }

  /* ── Internals ──────────────────────────────────────────────────── */

  private systemOptions(): GenerationOptions {
    return {
      triggeredBy: SYSTEM_TRIGGER,
      cooldownMs: AI_GENERATION_COOLDOWN_MS,
      batchSize: AI_QUESTION_BATCH_SIZE,
      model: this.models.modelFor("light"),
    };
  }

  private poolWhere(
    filters: NormalisedQuestionFilters,
  ): Prisma.InterviewQuestionWhereInput {
    return {
      track: filters.track,
      level: filters.level,
      difficulty: DIFFICULTY_RANGES[filters.difficulty],
      ...(filters.tags.length > 0 && {
        tags: { hasSome: expandTagAliases(filters.tags.map((tag) => tag.id)) },
      }),
    };
  }

  private countPool(filters: NormalisedQuestionFilters): Promise<number> {
    return this.prisma.interviewQuestion.count({ where: this.poolWhere(filters) });
  }

  /** Tag-free pool size per background combo, from one grouped query. */
  private async tagFreePoolSizes(): Promise<Map<string, number>> {
    const groups = await this.prisma.interviewQuestion.groupBy({
      by: ["track", "level", "difficulty"],
      where: { track: { in: [...QUESTION_TRACKS] } },
      _count: { _all: true },
    });
    const sizes = new Map<string, number>();
    for (const combo of BACKGROUND_FILL_COMBOS) {
      const range = DIFFICULTY_RANGES[combo.difficulty];
      const size = groups
        .filter(
          (g) =>
            g.track === combo.track &&
            g.level === combo.level &&
            g.difficulty >= range.gte &&
            g.difficulty <= range.lte,
        )
        .reduce((sum, g) => sum + g._count._all, 0);
      sizes.set(comboKey(combo), size);
    }
    return sizes;
  }

  private async generate(
    filters: NormalisedQuestionFilters,
    options: GenerationOptions,
  ): Promise<PoolFillResult> {
    const tagIds = filters.tags.map((tag) => tag.id);
    const filterHash = hashFilters(filters, tagIds);
    const reservation = await this.reserveGeneration(filters, filterHash, options);
    if ("skipped" in reservation) return skipped(reservation.skipped);

    let questions: ValidatedQuestion[];
    try {
      const prompt = buildQuestionBatchPrompt(filters, options.batchSize);
      const raw = await this.runner.runJson({
        label: "question-batch",
        model: options.model,
        system: prompt.system,
        user: prompt.user,
        schema: questionBatchSchema,
        maxTokens: prompt.maxTokens,
        temperature: 0.5,
        profile: "long",
      });
      questions = validateGeneratedQuestions(raw, {
        tags: filters.tags,
        allowedTypes: allowedQuestionTypes(filters.tags.length > 0),
      });
    } catch (error) {
      // The reservation row stays at 0 so the cooldown and caps cover failures.
      this.logger.warn(`Question batch failed for hash=${filterHash}: ${describeError(error)}`);
      return skipped("failed");
    }

    const inserted = await this.persist(filters, filterHash, reservation.logId, questions);
    this.logger.log(
      `Question batch for hash=${filterHash} (${options.triggeredBy === SYSTEM_TRIGGER ? "system" : "user"}): ${inserted} added, ${questions.length} valid of ${options.batchSize} requested`,
    );
    return inserted > 0 ? { generated: inserted, skipped: null } : skipped("failed");
  }

  private reserveGeneration(
    filters: NormalisedQuestionFilters,
    filterHash: string,
    options: GenerationOptions,
  ): Promise<Reservation> {
    return lockedTransaction(this.prisma, RESERVATION_LOCK_KEY, async (tx) => {
      const now = Date.now();
      const dayStart = new Date(now - DAY_MS);

      const recent = await tx.questionGenerationLog.findFirst({
        where: { filterHash, createdAt: { gte: new Date(now - options.cooldownMs) } },
        select: { id: true },
      });
      if (recent) return { skipped: "cooldown" };

      if (options.triggeredBy !== SYSTEM_TRIGGER) {
        const userCount = await tx.questionGenerationLog.count({
          where: { triggeredBy: options.triggeredBy, createdAt: { gte: dayStart } },
        });
        if (userCount >= AI_MAX_USER_DAILY_GENERATIONS) return { skipped: "user_daily_cap" };
      }

      const globalCount = await tx.questionGenerationLog.count({
        where: { createdAt: { gte: dayStart } },
      });
      if (globalCount >= GLOBAL_DAILY_GENERATION_BUDGET) {
        return { skipped: "global_daily_budget" };
      }

      const log = await tx.questionGenerationLog.create({
        data: {
          filterHash,
          filterCombo: {
            track: filters.track,
            level: filters.level,
            difficulty: filters.difficulty,
            tags: filters.tags.map((tag) => tag.id),
          },
          questionsGenerated: 0,
          triggeredBy: options.triggeredBy,
        },
        select: { id: true },
      });
      return { logId: log.id };
    });
  }

  /** Insert new questions (skipping prompts already in the bank) and record the count. */
  private async persist(
    filters: NormalisedQuestionFilters,
    filterHash: string,
    logId: string,
    questions: ValidatedQuestion[],
  ): Promise<number> {
    if (questions.length === 0) return 0;
    try {
      const existing = await this.prisma.interviewQuestion.findMany({
        where: {
          track: filters.track,
          prompt: { in: questions.map((q) => q.prompt) },
        },
        select: { prompt: true },
      });
      const known = new Set(existing.map((row) => promptKey(row.prompt)));
      const fresh = questions.filter((q) => !known.has(promptKey(q.prompt)));
      if (fresh.length === 0) return 0;

      const difficulty = DIFFICULTY_MAP[filters.difficulty] ?? 3;
      await this.prisma.$transaction([
        this.prisma.interviewQuestion.createMany({
          data: fresh.map((q) => ({
            track: filters.track,
            level: filters.level,
            difficulty,
            tags: q.tags,
            type: q.type,
            prompt: q.prompt,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            correctOptionIndices: [q.correctOptionIndex],
            multiSelect: false,
            expectedPoints: q.expectedPoints,
            redFlags: q.redFlags,
            rubric: q.rubric,
            modelAnswer: q.modelAnswer,
            followUpIds: [],
            source: "ai-generated",
            generatedForHash: filterHash,
          })),
        }),
        this.prisma.questionGenerationLog.update({
          where: { id: logId },
          data: { questionsGenerated: fresh.length },
        }),
      ]);
      return fresh.length;
    } catch (error) {
      this.logger.error(`Saving generated questions failed for hash=${filterHash}: ${describeError(error)}`);
      return 0;
    }
  }
}

function skipped(reason: PoolFillSkipReason): PoolFillResult {
  return { generated: 0, skipped: reason };
}

function hashFilters(
  filters: Pick<NormalisedQuestionFilters, "track" | "level" | "difficulty">,
  tagIds: readonly string[],
): string {
  const normalized = {
    track: filters.track,
    level: filters.level,
    difficulty: filters.difficulty,
    tags: [...tagIds].sort(),
  };
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex").slice(0, 16);
}

function comboKey(combo: Pick<NormalisedQuestionFilters, "track" | "level" | "difficulty">): string {
  return `${combo.track}/${combo.level}/${combo.difficulty}`;
}

/** Error class/code for logs; never the message (it can echo request content). */
function describeError(error: unknown): string {
  if (!(error instanceof Error)) return "unknown error";
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? `${error.name} ${code}` : error.name;
}
