import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { PremiumRequiredException, QuotaExceededException } from "../../common/errors";
import { getMonthWindow, lockedTransaction, userLockKey } from "../../common/plan";
import { AiQuestionGeneratorService } from "../ai/ai-question-generator.service";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { generateReport } from "./engine";
import type { CreateInterviewSessionDto } from "./interview-prep.dto";
import {
  MIN_SESSION_QUESTIONS,
  NOT_ENOUGH_QUESTIONS_MESSAGE,
  QUESTION_MAX_SCORE,
  resolveSessionShape,
  resolveSessionTags,
} from "./interview-rules";
import {
  SESSION_QUESTIONS_INCLUDE,
  toClientSession,
  toInputJson,
  toScoredQuestion,
  toSessionSummary,
  type ClientSession,
  type SessionSummary,
  type SessionSummaryRow,
} from "./interview-view";
import { isInterviewerFree } from "./interviewer-traits";
import { QuestionPoolService } from "./question-pool.service";

const MAX_SESSION_SUMMARIES = 100;

/** Session lifecycle: list, read, create (with quota) and complete (idempotent). */
@Injectable()
export class InterviewSessionsService {
  private readonly logger = new Logger(InterviewSessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly pool: QuestionPoolService,
    private readonly generator: AiQuestionGeneratorService,
  ) {}

  /** Newest first; one query, no question bodies or reports loaded. */
  async listSummaries(userId: string): Promise<SessionSummary[]> {
    const rows = await this.prisma.$queryRaw<SessionSummaryRow[]>`
      SELECT s."id", s."status", s."track", s."level", s."difficulty", s."interviewType",
             s."interviewerId", s."questionCount", s."totalScore", s."createdAt", s."updatedAt",
             a."answeredCount", a."scored", a."possible"
      FROM "InterviewSession" s
      CROSS JOIN LATERAL (
        SELECT COUNT(*)::int AS "answeredCount",
               COALESCE(SUM(GREATEST(LEAST(COALESCE(sq."score", 0), sq."maxScore"), 0)), 0)::float8 AS "scored",
               COALESCE(SUM(GREATEST(sq."maxScore", 0)), 0)::float8 AS "possible"
        FROM "InterviewSessionQuestion" sq
        WHERE sq."sessionId" = s."id" AND sq."userAnswer" IS NOT NULL
      ) a
      WHERE s."userId" = ${userId}
      ORDER BY s."createdAt" DESC
      LIMIT ${MAX_SESSION_SUMMARIES}`;
    return rows.map(toSessionSummary);
  }

  /** The session with its questions; answer keys only for answered questions. */
  async getSession(userId: string, sessionId: string): Promise<ClientSession> {
    const session = await this.prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
      include: SESSION_QUESTIONS_INCLUDE,
    });
    if (!session) throw new NotFoundException("Session not found");
    return toClientSession(session);
  }

  async createSession(
    userId: string,
    dto: CreateInterviewSessionDto,
  ): Promise<ClientSession & { requestedQuestionCount: number }> {
    const plan = await this.entitlements.getPlan(userId);
    if (dto.interviewerId && !plan.isPremium && !isInterviewerFree(dto.interviewerId)) {
      throw new PremiumRequiredException("interviewers");
    }

    const tags = resolveSessionTags(dto.tags);
    const shape = resolveSessionShape(dto);
    const sessionLimit = plan.limits.monthlyMockSessions;
    const questionLimit = plan.limits.monthlyQuestions;
    const { start: monthStart, nextStart } = getMonthWindow();

    // Cheap pre-check before any pool or generation work; the locked check below decides.
    if (sessionLimit !== null || questionLimit !== null) {
      const [sessionsUsed, questionsUsed] = await Promise.all([
        this.countSessions(this.prisma, userId, monthStart),
        this.countAnswered(userId, monthStart),
      ]);
      if (sessionLimit !== null && sessionsUsed >= sessionLimit) {
        throw new QuotaExceededException("mockSessions", sessionLimit, sessionsUsed, nextStart);
      }
      if (questionLimit !== null && questionsUsed >= questionLimit) {
        throw new QuotaExceededException("questions", questionLimit, questionsUsed, nextStart);
      }
    }

    const difficulty = dto.difficulty ?? "medium";
    const roleFocus = dto.roleFocus ?? "fullstack";
    const interviewType = dto.interviewType ?? "coding";
    const questionIds = await this.pool.pickQuestions({
      userId,
      isPremium: plan.isPremium,
      track: dto.track,
      level: dto.level,
      difficulty,
      tags,
      questionCount: shape.questionCount,
      roleFocus,
      interviewType,
    });
    if (questionIds.length < MIN_SESSION_QUESTIONS) {
      throw new UnprocessableEntityException(NOT_ENOUGH_QUESTIONS_MESSAGE);
    }

    const session = await lockedTransaction(
      this.prisma,
      userLockKey("interview", userId),
      async (tx) => {
        if (sessionLimit !== null) {
          const used = await this.countSessions(tx, userId, monthStart);
          if (used >= sessionLimit) {
            throw new QuotaExceededException("mockSessions", sessionLimit, used, nextStart);
          }
        }
        return tx.interviewSession.create({
          data: {
            userId,
            track: dto.track,
            level: dto.level,
            tags,
            roleFocus,
            interviewType,
            duration: dto.duration ?? 60,
            difficulty,
            companyStyle: dto.companyStyle ?? "startup",
            questionCount: questionIds.length,
            persona: shape.persona,
            interviewerId: shape.interviewerId,
            status: "in_progress",
            questions: {
              createMany: {
                data: questionIds.map((questionId, orderIndex) => ({
                  questionId,
                  orderIndex,
                  maxScore: QUESTION_MAX_SCORE,
                  isFollowUp: false,
                })),
              },
            },
          },
          include: SESSION_QUESTIONS_INCLUDE,
        });
      },
    );

    return { ...toClientSession(session), requestedQuestionCount: shape.questionCount };
  }

  /**
   * POST /sessions/:id/complete. Idempotent: an already completed session is
   * returned as is (no new report, no generation). 422 when nothing was answered.
   */
  async completeSession(userId: string, sessionId: string): Promise<ClientSession> {
    const session = await this.prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
      select: { status: true },
    });
    if (!session) throw new NotFoundException("Session not found");
    if (session.status !== "completed") await this.finishSession(userId, sessionId);
    return this.getSession(userId, sessionId);
  }

  /**
   * Builds the report over the answered questions and moves the session to
   * `completed`. Only the request that performs the in_progress → completed
   * transition may trigger premium piggyback generation.
   */
  async finishSession(userId: string, sessionId: string): Promise<void> {
    const transitioned = await lockedTransaction(
      this.prisma,
      userLockKey("interview", userId),
      async (tx) => {
        const session = await tx.interviewSession.findFirst({
          where: { id: sessionId, userId },
          select: {
            status: true,
            track: true,
            level: true,
            difficulty: true,
            questions: {
              select: {
                questionId: true,
                userAnswer: true,
                score: true,
                maxScore: true,
                feedback: true,
                question: { select: { prompt: true, type: true, tags: true } },
              },
              orderBy: { orderIndex: "asc" },
            },
          },
        });
        if (!session) throw new NotFoundException("Session not found");
        if (session.status === "completed") return null;

        const answered = session.questions.filter((q) => q.userAnswer !== null);
        if (answered.length === 0) {
          throw new UnprocessableEntityException(
            "Answer at least one question before ending the interview.",
          );
        }
        const report = generateReport(
          session.track,
          session.level,
          answered.map(toScoredQuestion),
          session.questions.length,
        );
        const { count } = await tx.interviewSession.updateMany({
          where: { id: sessionId, userId, status: "in_progress" },
          data: {
            status: "completed",
            totalScore: report.overallScore,
            report: toInputJson(report),
          },
        });
        return count === 1 ? session : null;
      },
    );

    if (transitioned) await this.piggyback(userId, transitioned);
  }

  /**
   * Premium only (free users never trigger bank generation): occasionally top
   * up the tag-free pool for this track/level/difficulty, in the background.
   */
  private async piggyback(
    userId: string,
    filters: { track: string; level: string; difficulty: string },
  ): Promise<void> {
    try {
      const plan = await this.entitlements.getPlan(userId);
      if (!plan.isPremium) return;
      void this.generator
        .maybePiggybackGenerate({
          track: filters.track,
          level: filters.level,
          difficulty: filters.difficulty,
        })
        .catch(() => undefined);
    } catch (error) {
      this.logger.warn(
        `Piggyback check failed: ${error instanceof Error ? error.name : "unknown error"}`,
      );
    }
  }

  private countSessions(
    client: Prisma.TransactionClient,
    userId: string,
    since: Date,
  ): Promise<number> {
    return client.interviewSession.count({ where: { userId, createdAt: { gte: since } } });
  }

  private countAnswered(userId: string, since: Date): Promise<number> {
    return this.prisma.interviewSessionQuestion.count({
      where: { session: { userId }, answeredAt: { gte: since } },
    });
  }
}
