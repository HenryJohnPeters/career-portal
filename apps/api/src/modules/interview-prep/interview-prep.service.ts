import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { InterviewQuestion, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import {
  QuestionSelector,
  RuleBasedEvaluator,
  FollowUpStrategy,
  PersonaResponder,
  ReportGenerator,
  QuestionRecord,
} from "./engine";
import { CreateInterviewSessionDto } from "./interview-prep.dto";
import { AiQuestionGeneratorService } from "../ai/ai-question-generator.service";
import {
  TECH_CATEGORIES,
  DIFFICULTY_RANGES,
  FREE_TIER,
  sanitiseTags,
} from "../../common/constants";
import { isActivePremium } from "../../common/subscription.util";
import {
  INTERVIEWER_TRAITS,
  clampQuestionCount,
  isInterviewerFree,
} from "./interviewer-traits";

interface AnswerFeedback {
  pointsHit: string[];
  pointsMissed: string[];
  redFlagsTriggered: string[];
  criteriaScores: { name: string; score: number; maxScore: number }[];
  suggestions: string[];
  personaResponse: string;
  correctAnswer: string;
  correctOptionIndex: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
}

type SessionQuestionWithQuestion = Prisma.InterviewSessionQuestionGetPayload<{
  include: { question: true };
}>;

@Injectable()
export class InterviewPrepService {
  private readonly logger = new Logger(InterviewPrepService.name);
  private readonly questionSelector = new QuestionSelector();
  private readonly evaluator = new RuleBasedEvaluator();
  private readonly followUpStrategy = new FollowUpStrategy();
  private readonly personaResponder = new PersonaResponder();
  private readonly reportGenerator = new ReportGenerator();

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiQuestionGenerator: AiQuestionGeneratorService,
  ) {}

  /** List all sessions for a user */
  async getSessions(userId: string) {
    return this.prisma.interviewSession.findMany({
      where: { userId },
      include: {
        questions: {
          include: { question: true },
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  /** Get a single session by id */
  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        questions: {
          include: { question: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });
    if (!session) throw new NotFoundException("Session not found");
    return session;
  }

  /** Create a new interview session: select questions from the bank */
  async createSession(userId: string, dto: CreateInterviewSessionDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isPremium = user ? isActivePremium(user) : false;

    // ── Enforce interviewer premium restriction ──────────────────────
    const interviewerId = dto.interviewerId;
    if (interviewerId && !isPremium && !isInterviewerFree(interviewerId)) {
      throw new ForbiddenException(
        `This interviewer is only available to Premium users. Free users can use the first ${FREE_TIER.interviewerCount} interviewers. Upgrade to Premium to unlock all interviewers.`,
      );
    }

    const interviewerTraits = interviewerId
      ? INTERVIEWER_TRAITS[interviewerId]
      : undefined;
    const questionCount = clampQuestionCount(
      interviewerTraits?.questionCount ?? dto.questionCount ?? 10,
    );

    // Persona: interviewer config takes precedence over explicit DTO value.
    // This ensures Jordan (tough) gives tough feedback, Alex (friendly) gives friendly feedback.
    const persona = interviewerTraits?.persona ?? dto.persona ?? "neutral";
    const roleFocus = dto.roleFocus ?? "fullstack";
    // Valid values: "codings" | "system-design" | "behavioral".
    // UI does not expose this picker so it always arrives as undefined — default to "coding".
    const interviewType = dto.interviewType ?? "coding";
    const duration = dto.duration ?? 60;
    const difficulty = dto.difficulty ?? "medium";
    const companyStyle = dto.companyStyle ?? "startup";
    const safeInterviewerId = interviewerTraits ? interviewerId : undefined;

    // Sanitize and normalize tags — the DB stores lowercase tags
    const tags = sanitiseTags(dto.tags ?? []).map((t) => t.toLowerCase());

    // ── Ensure the question pool has enough content ─────────────────
    // Check pool size for this combo. If too thin, generate questions
    // synchronously so the session has enough content. This applies to
    // ALL users (not just premium) — an empty pool means nobody can play.
    const poolFilters = {
      track: dto.track,
      level: dto.level,
      difficulty,
      tags,
    };

    const poolSize = await this.aiQuestionGenerator.getPoolSize(poolFilters);

    if (poolSize < questionCount) {
      try {
        // Pass userId so the per-user daily generation cap is enforced
        await this.aiQuestionGenerator.ensurePoolForFiltersUrgent(
          poolFilters,
          userId,
        );
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Urgent pool fill failed for user ${userId} (${dto.track}/${dto.level}/${difficulty}) - proceeding with existing pool. Reason: ${reason}`,
        );
      }
    }

    // ── Build the primary pool query ──────────────────────────────────
    const poolWhere = this.buildPoolWhere(
      dto.track,
      dto.level,
      difficulty,
      tags,
    );

    // Load the question pool scoped to all user-selected filters
    let pool = await this.prisma.interviewQuestion.findMany({
      where: poolWhere,
    });

    // ── Fallback: if tag-filtered pool is still empty, broaden to tag-free ──
    if (pool.length === 0 && tags.length > 0) {
      try {
        await this.aiQuestionGenerator.ensurePoolForFiltersUrgent(
          { ...poolFilters, tags: [] },
          userId,
        );
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Fallback pool fill without tags failed for user ${userId} (${dto.track}/${dto.level}/${difficulty}). Reason: ${reason}`,
        );
      }
      const fallbackWhere = this.buildPoolWhere(
        dto.track,
        dto.level,
        difficulty,
        [],
      );
      pool = await this.prisma.interviewQuestion.findMany({
        where: fallbackWhere,
      });
    }

    const poolRecords = this.toQuestionRecords(pool);

    // Gather recent question IDs answered by this user as anti-repeat input
    const recentSessions = await this.prisma.interviewSession.findMany({
      where: { userId, status: "completed" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { questions: { select: { questionId: true } } },
    });
    const recentlyAnsweredIds = recentSessions.flatMap((s) =>
      s.questions.map((q) => q.questionId),
    );

    // Select questions using the adaptive algorithm with anti-repeat ids
    const selected = this.questionSelector.select(
      poolRecords,
      {
        track: dto.track,
        level: dto.level,
        tags,
        questionCount,
        persona,
        roleFocus,
        interviewType,
        duration,
        difficulty,
        companyStyle,
      },
      recentlyAnsweredIds,
      [],
    );

    const createData: Prisma.InterviewSessionUncheckedCreateInput = {
      userId,
      track: dto.track,
      level: dto.level,
      tags,
      roleFocus,
      interviewType,
      duration,
      difficulty,
      companyStyle,
      questionCount: selected.length,
      persona,
      interviewerId: safeInterviewerId,
      status: "in_progress",
      questions: {
        create: selected.map((q, idx) => ({
          questionId: q.id,
          orderIndex: idx,
          maxScore: 10,
          isFollowUp: false,
        })),
      },
    };

    // Create the session with its questions
    const session = isPremium
      ? await this.prisma.interviewSession.create({
          data: createData,
          include: {
            questions: {
              include: { question: true },
              orderBy: { orderIndex: "asc" },
            },
          },
        })
      : await this.prisma.$transaction(
          async (tx) => {
            const monthStart = new Date();
            monthStart.setUTCDate(1);
            monthStart.setUTCHours(0, 0, 0, 0);

            const sessionCount = await tx.interviewSession.count({
              where: { userId, createdAt: { gte: monthStart } },
            });
            if (sessionCount >= FREE_TIER.monthlyMockSessions) {
              throw new ForbiddenException(
                `Free users are limited to ${FREE_TIER.monthlyMockSessions} mock interview sessions per month. Upgrade to Premium for unlimited sessions.`,
              );
            }

            return tx.interviewSession.create({
              data: createData,
              include: {
                questions: {
                  include: { question: true },
                  orderBy: { orderIndex: "asc" },
                },
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

    return session;
  }

  /** Get the next unanswered question in the session */
  async getNextQuestion(userId: string, sessionId: string) {
    const session = await this.getSession(userId, sessionId);

    if (session.status === "completed") {
      return {
        sessionQuestion: null,
        sessionStatus: "completed",
        progress: this.getProgress(session.questions),
      };
    }

    const next = session.questions.find((sq) => sq.userAnswer === null);
    if (!next) {
      return {
        sessionQuestion: null,
        sessionStatus: "completed",
        progress: this.getProgress(session.questions),
      };
    }

    // ── 50/50 hint: pre-compute eliminated wrong-option indices server-side ──
    // The correct option index is stripped before sending to the client, so
    // the client cannot compute this itself. We calculate it here where the
    // answer key is still available, then include it as a safe hint.
    const hasFiftyFifty = session.interviewerId
      ? (INTERVIEWER_TRAITS[session.interviewerId]?.fiftyFifty ?? false)
      : false;

    let fiftyFiftyEliminated: number[] | null = null;
    if (hasFiftyFifty) {
      const correctIdx = next.question.correctOptionIndex;
      const optionCount = this.parseQuestionOptions(
        next.question.options,
      ).length;
      if (optionCount >= 4) {
        // Collect all wrong indices, then pick 2 to eliminate using a
        // Fisher-Yates shuffle seeded conceptually by order (Math.random
        // is fine: the client memoizes by question ID, so this only runs once).
        const wrongIndices = Array.from(
          { length: optionCount },
          (_, i) => i,
        ).filter((i) => i !== correctIdx);
        for (let i = wrongIndices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [wrongIndices[i], wrongIndices[j]] = [
            wrongIndices[j],
            wrongIndices[i],
          ];
        }
        fiftyFiftyEliminated = wrongIndices.slice(0, 2);
      }
    }

    const sanitised = this.sanitiseSessionQuestion(next);
    return {
      sessionQuestion:
        fiftyFiftyEliminated !== null
          ? { ...sanitised, fiftyFiftyEliminated }
          : sanitised,
      sessionStatus: "in_progress",
      progress: this.getProgress(session.questions),
    };
  }

  /** Strip answer-key fields before sending a question to the client. */
  private sanitiseSessionQuestion(sq: SessionQuestionWithQuestion) {
    const { question, ...rest } = sq;
    const {
      correctOptionIndex: _c,
      correctOptionIndices: _ci,
      modelAnswer: _m,
      rubric: _r,
      expectedPoints: _ep,
      redFlags: _rf,
      followUpIds: _fu,
      ...safeQuestion
    } = question;
    return { ...rest, question: safeQuestion };
  }

  /** Submit an answer, evaluate it, possibly inject a follow-up */
  async submitAnswer(
    userId: string,
    sessionId: string,
    sessionQuestionId: string,
    answer: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isPremium = user ? isActivePremium(user) : false;

    const session = await this.getSession(userId, sessionId);
    const sq = session.questions.find((q) => q.id === sessionQuestionId);
    if (!sq) throw new NotFoundException("Session question not found");

    const questionRecord: QuestionRecord = {
      ...sq.question,
      options: this.parseQuestionOptions(sq.question.options),
      rubric: this.parseQuestionRubric(sq.question.rubric),
    };

    // Evaluate the answer
    const evaluation = this.evaluator.evaluate(questionRecord, answer);

    // Resolve interviewer traits — persona and adviceLevel both come from the
    // interviewer config so the response style is always consistent with the
    // avatar / voice the user selected during setup.
    const interviewerTraits = session.interviewerId
      ? INTERVIEWER_TRAITS[session.interviewerId]
      : undefined;
    const adviceLevel = interviewerTraits?.adviceLevel ?? "standard";
    // session.persona was already stored with the interviewer-derived value
    // at session creation time, but we resolve it again here as a safety net.
    const effectivePersona =
      interviewerTraits?.persona ?? session.persona ?? "neutral";

    // Generate persona response with advice level
    const personaResponse = this.personaResponder.respond(
      effectivePersona,
      evaluation.score,
      evaluation.maxScore,
      evaluation.pointsMissed,
      adviceLevel,
    );

    const feedback: AnswerFeedback = {
      pointsHit: evaluation.pointsHit,
      pointsMissed: evaluation.pointsMissed,
      redFlagsTriggered: evaluation.redFlagsTriggered,
      criteriaScores: evaluation.criteriaScores,
      suggestions: evaluation.suggestions,
      personaResponse,
      correctAnswer: evaluation.correctAnswer,
      correctOptionIndex: evaluation.correctOptionIndex,
      selectedOptionIndex: evaluation.selectedOptionIndex,
      isCorrect: evaluation.isCorrect,
    };

    // Save the answer and score (with atomic free-tier question-limit check)
    const updated = isPremium
      ? await this.prisma.interviewSessionQuestion.update({
          where: { id: sessionQuestionId },
          data: {
            userAnswer: answer,
            score: evaluation.score,
            feedback: this.toInputJson(feedback),
            answeredAt: new Date(),
          },
          include: { question: true },
        })
      : await this.prisma.$transaction(
          async (tx) => {
            const monthStart = new Date();
            monthStart.setUTCDate(1);
            monthStart.setUTCHours(0, 0, 0, 0);

            const answeredThisMonth = await tx.interviewSessionQuestion.count({
              where: {
                session: { userId },
                answeredAt: { gte: monthStart },
              },
            });

            if (answeredThisMonth >= FREE_TIER.monthlyQuestions) {
              throw new ForbiddenException(
                `Free users are limited to ${FREE_TIER.monthlyQuestions} practice questions per month. Upgrade to Premium for unlimited questions.`,
              );
            }

            return tx.interviewSessionQuestion.update({
              where: { id: sessionQuestionId },
              data: {
                userAnswer: answer,
                score: evaluation.score,
                feedback: this.toInputJson(feedback),
                answeredAt: new Date(),
              },
              include: { question: true },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

    // Check if follow-up is needed
    let followUp = null;
    if (this.followUpStrategy.shouldFollowUp(evaluation)) {
      // Scope follow-up pool to the same session filters
      const followUpWhere = this.buildPoolWhere(
        session.track,
        session.level,
        session.difficulty,
        session.tags ?? [],
      );
      const followUpPool = await this.prisma.interviewQuestion.findMany({
        where: followUpWhere,
      });
      const poolRecords = this.toQuestionRecords(followUpPool);

      const followUpQuestion = this.followUpStrategy.selectFollowUp(
        questionRecord,
        evaluation,
        poolRecords,
      );

      if (followUpQuestion) {
        const maxOrder = Math.max(
          ...session.questions.map((q) => q.orderIndex),
        );
        followUp = await this.prisma.interviewSessionQuestion.create({
          data: {
            sessionId,
            questionId: followUpQuestion.id,
            orderIndex: maxOrder + 1,
            maxScore: 10,
            isFollowUp: true,
            parentQuestionId: sq.questionId,
          },
          include: { question: true },
        });

        // Update session question count
        await this.prisma.interviewSession.update({
          where: { id: sessionId },
          data: { questionCount: { increment: 1 } },
        });
      }
    }

    // Check if session is complete (all questions answered)
    const refreshedSession = await this.getSession(userId, sessionId);
    const allAnswered = refreshedSession.questions.every(
      (q) => q.userAnswer !== null,
    );

    if (allAnswered) {
      await this.completeSession(userId, sessionId);
    }

    return { answered: updated, followUp, feedback };
  }

  /** Complete the session and generate the final report */
  async completeSession(userId: string, sessionId: string) {
    const session = await this.getSession(userId, sessionId);

    const scoredQuestions = session.questions
      .filter((sq) => sq.userAnswer !== null)
      .map((sq) => ({
        questionId: sq.questionId,
        prompt: sq.question.prompt,
        type: sq.question.type,
        score: sq.score ?? 0,
        maxScore: sq.maxScore,
        pointsMissed: this.extractPointsMissed(sq.feedback),
        tags: sq.question.tags,
      }));

    const report = this.reportGenerator.generate(
      session.track,
      session.level,
      scoredQuestions,
    );

    const totalScore = scoredQuestions.reduce((sum, q) => sum + q.score, 0);

    const updated = await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        totalScore,
        report: this.toInputJson(report),
      },
      include: {
        questions: {
          include: { question: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    // Piggyback generation: premium users randomly trigger new question generation
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user && isActivePremium(user)) {
      this.aiQuestionGenerator
        .maybePiggybackGenerate(
          {
            track: session.track,
            level: session.level,
            difficulty: session.difficulty,
            tags: session.tags,
          },
          userId,
        )
        .catch((err) =>
          this.logger.warn(
            "Piggyback question generation failed (non-critical)",
            err,
          ),
        );
    }

    return updated;
  }

  /**
   * Returns a structured options catalog for the setup form.
   * The catalog is built from:
   *   1. A static TECH_CATEGORIES registry (the "master list" — expand here)
   *   2. Dynamic values already present in the question bank
   * This means the UI always shows the full category picker even before
   * any questions exist in the DB for a given tag.
   */
  async getAvailableOptions() {
    // Only fetch distinct tags from the DB — avoids loading every question row
    const rows = await this.prisma.interviewQuestion.findMany({
      select: { tags: true },
      distinct: ["tags"],
    });

    // Merge DB tags into the catalog so new DB-only tags are surfaced
    const catalogTags = new Set<string>();
    for (const cat of TECH_CATEGORIES) {
      for (const item of cat.items) catalogTags.add(item.toLowerCase());
    }
    const dbOnlyTags = new Set<string>();
    for (const row of rows) {
      for (const t of row.tags) {
        if (!catalogTags.has(t.toLowerCase())) dbOnlyTags.add(t);
      }
    }

    return {
      techCategories: [
        ...TECH_CATEGORIES,
        ...(dbOnlyTags.size > 0
          ? [{ key: "other", label: "Other", items: [...dbOnlyTags] }]
          : []),
      ],
      levels: ["junior", "mid", "senior"],
      roleFocuses: ["frontend", "backend", "fullstack", "platform"],
      interviewTypes: ["coding", "system-design", "behavioral"],
      durations: [30, 60, 90],
      difficulties: ["easy", "medium", "hard"],
      companyStyles: ["faang", "startup", "enterprise"],
      personas: ["friendly", "neutral", "tough"],
    };
  }

  private getProgress(questions: { userAnswer: string | null }[]) {
    const answered = questions.filter((q) => q.userAnswer !== null).length;
    return { answered, total: questions.length };
  }

  /** Build a Prisma where clause for loading questions by track/level/difficulty/tags. */
  private buildPoolWhere(
    track: string,
    level: string,
    difficulty: string,
    tags: string[],
  ): Prisma.InterviewQuestionWhereInput {
    const where: Prisma.InterviewQuestionWhereInput = { track, level };
    const range = DIFFICULTY_RANGES[difficulty];
    if (range) where.difficulty = range;
    if (tags.length > 0) where.tags = { hasSome: tags };
    return where;
  }

  private parseQuestionOptions(options: Prisma.JsonValue): string[] {
    if (!Array.isArray(options)) return [];
    return options.filter(
      (value): value is string => typeof value === "string",
    );
  }

  private parseQuestionRubric(
    rubric: Prisma.JsonValue,
  ): QuestionRecord["rubric"] {
    if (!rubric || typeof rubric !== "object") return { criteria: [] };
    const criteria = (rubric as Record<string, unknown>).criteria;
    if (!Array.isArray(criteria)) return { criteria: [] };

    return {
      criteria: criteria
        .filter(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as Record<string, unknown>).name === "string" &&
            typeof (item as Record<string, unknown>).weight === "number" &&
            Array.isArray((item as Record<string, unknown>).keywords),
        )
        .map((item) => ({
          name: (item as Record<string, unknown>).name as string,
          weight: (item as Record<string, unknown>).weight as number,
          keywords: (
            (item as Record<string, unknown>).keywords as unknown[]
          ).filter((keyword): keyword is string => typeof keyword === "string"),
        })),
    };
  }

  private toInputJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private extractPointsMissed(feedback: Prisma.JsonValue | null): string[] {
    if (!feedback || typeof feedback !== "object") return [];
    const pointsMissed = (feedback as Record<string, unknown>).pointsMissed;
    if (!Array.isArray(pointsMissed)) return [];
    return pointsMissed.filter(
      (point): point is string => typeof point === "string",
    );
  }

  /** Map Prisma rows to engine QuestionRecord objects. */
  private toQuestionRecords(rows: InterviewQuestion[]): QuestionRecord[] {
    return rows.map((q) => ({
      ...q,
      options: this.parseQuestionOptions(q.options),
      rubric: this.parseQuestionRubric(q.rubric),
    }));
  }
}
