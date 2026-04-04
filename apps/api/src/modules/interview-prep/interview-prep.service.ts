import { Injectable, NotFoundException } from "@nestjs/common";
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
import { TECH_CATEGORIES, DIFFICULTY_RANGES } from "../../common/constants";
import { isActivePremium } from "../../common/subscription.util";

// Interviewer traits type (synced with frontend)
interface InterviewerTraits {
  questionCount: number;
  adviceLevel: "minimal" | "standard" | "detailed";
  fiftyFifty: boolean;
  /** The persona template this interviewer uses for answer responses */
  persona: "friendly" | "neutral" | "tough";
}

// Interviewer traits lookup map (synced with frontend configs).
// persona drives PersonaResponder template selection; adviceLevel controls verbosity.
const INTERVIEWER_TRAITS: Record<string, InterviewerTraits> = {
  none: {
    questionCount: 25,
    adviceLevel: "standard",
    fiftyFifty: false,
    persona: "neutral",
  },
  alex: {
    questionCount: 5,
    adviceLevel: "detailed",
    fiftyFifty: true,
    persona: "friendly",
  },
  riley: {
    questionCount: 7,
    adviceLevel: "detailed",
    fiftyFifty: false,
    persona: "friendly",
  },
  morgan: {
    questionCount: 10,
    adviceLevel: "standard",
    fiftyFifty: false,
    persona: "neutral",
  },
  sam: {
    questionCount: 12,
    adviceLevel: "standard",
    fiftyFifty: false,
    persona: "neutral",
  },
  kai: {
    questionCount: 15,
    adviceLevel: "minimal",
    fiftyFifty: false,
    persona: "neutral",
  },
  jordan: {
    questionCount: 15,
    adviceLevel: "minimal",
    fiftyFifty: false,
    persona: "tough",
  },
  phoenix: {
    questionCount: 18,
    adviceLevel: "minimal",
    fiftyFifty: false,
    persona: "tough",
  },
  nova: {
    questionCount: 20,
    adviceLevel: "minimal",
    fiftyFifty: false,
    persona: "neutral",
  },
};

function clampQuestionCount(value: number): number {
  return Math.max(3, Math.min(25, value));
}

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

@Injectable()
export class InterviewPrepService {
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
    const interviewerId = dto.interviewerId;
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

    // Normalize tags to lowercase — the DB stores lowercase tags
    const tags = (dto.tags ?? []).map((t) => t.toLowerCase());

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
      } catch {
        // Non-critical — proceed with whatever we have
      }
    }

    // ── Build the primary pool query ──────────────────────────────────
    const poolWhere: Record<string, unknown> = {
      track: dto.track,
      level: dto.level,
    };
    const difficultyRange = DIFFICULTY_RANGES[difficulty];
    if (difficultyRange) poolWhere.difficulty = difficultyRange;
    // Enforce tag filter — questions must share at least one selected tag
    if (tags.length > 0) {
      poolWhere.tags = { hasSome: tags };
    }

    // Load the question pool scoped to all user-selected filters
    let pool = await this.prisma.interviewQuestion.findMany({
      where: poolWhere as any,
    });

    // ── Fallback: if tag-filtered pool is still empty, broaden to tag-free ──
    // The urgent generation above creates questions tagged only with the track
    // name (e.g. ["frontend"]) which won\'t match a hasSome:["react","typescript"]
    // filter. When that happens we fall back to the track+level+difficulty pool
    // so the user always gets *something* to answer.
    if (pool.length === 0 && tags.length > 0) {
      try {
        await this.aiQuestionGenerator.ensurePoolForFiltersUrgent(
          { ...poolFilters, tags: [] },
          userId,
        );
      } catch {
        // Non-critical
      }
      const fallbackWhere: Record<string, unknown> = {
        track: dto.track,
        level: dto.level,
      };
      if (difficultyRange) fallbackWhere.difficulty = difficultyRange;
      pool = await this.prisma.interviewQuestion.findMany({
        where: fallbackWhere as any,
      });
    }

    const poolRecords: QuestionRecord[] = pool.map((q) => ({
      ...q,
      options: (q.options as unknown as string[]) ?? undefined,
      rubric: q.rubric as unknown as QuestionRecord["rubric"],
    }));

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

    // Create the session with its questions
    const session = await this.prisma.interviewSession.create({
      data: {
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
      } as any,
      include: {
        questions: {
          include: { question: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

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
      const q = next.question as any;
      const correctIdx: number = q.correctOptionIndex ?? 0;
      const optionCount: number = Array.isArray(q.options)
        ? (q.options as unknown[]).length
        : 0;
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
  private sanitiseSessionQuestion(sq: any) {
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
    const session = await this.getSession(userId, sessionId);
    const sq = session.questions.find((q) => q.id === sessionQuestionId);
    if (!sq) throw new NotFoundException("Session question not found");

    const questionRecord: QuestionRecord = {
      ...sq.question,
      options: (sq.question.options as unknown as string[]) ?? undefined,
      rubric: sq.question.rubric as unknown as QuestionRecord["rubric"],
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

    // Save the answer and score
    const updated = await this.prisma.interviewSessionQuestion.update({
      where: { id: sessionQuestionId },
      data: {
        userAnswer: answer,
        score: evaluation.score,
        feedback: feedback as unknown as any,
        answeredAt: new Date(),
      },
      include: { question: true },
    });

    // Check if follow-up is needed
    let followUp = null;
    if (this.followUpStrategy.shouldFollowUp(evaluation)) {
      // Scope follow-up pool to the same session filters — prevents escaping user constraints
      const followUpWhere: Record<string, unknown> = {
        track: session.track,
        level: session.level,
      };
      const sessionDiffRange = DIFFICULTY_RANGES[session.difficulty];
      if (sessionDiffRange) followUpWhere.difficulty = sessionDiffRange;
      if (session.tags && session.tags.length > 0) {
        followUpWhere.tags = { hasSome: session.tags };
      }
      const followUpPool = await this.prisma.interviewQuestion.findMany({
        where: followUpWhere as any,
      });
      const poolRecords: QuestionRecord[] = followUpPool.map((q) => ({
        ...q,
        options: (q.options as unknown as string[]) ?? undefined,
        rubric: q.rubric as unknown as QuestionRecord["rubric"],
      }));

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
        pointsMissed: (sq.feedback as unknown as any)?.pointsMissed ?? [],
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
        report: report as unknown as any,
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
        .catch(() => {});
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
    const questions = await this.prisma.interviewQuestion.findMany({
      select: { track: true, tags: true, level: true, type: true },
    });

    // Merge DB tags into the catalog so new DB-only tags are surfaced
    const catalogTags = new Set<string>();
    for (const cat of TECH_CATEGORIES) {
      for (const item of cat.items) catalogTags.add(item.toLowerCase());
    }
    const dbOnlyTags = new Set<string>();
    for (const q of questions) {
      for (const t of q.tags) {
        if (!catalogTags.has(t.toLowerCase())) dbOnlyTags.add(t);
      }
    }

    // Build flat tags list (union of catalog + DB)
    const allTags = new Set<string>();
    for (const cat of TECH_CATEGORIES) {
      for (const item of cat.items) allTags.add(item);
    }
    for (const q of questions) {
      for (const t of q.tags) allTags.add(t);
    }

    return {
      techCategories: [
        ...TECH_CATEGORIES,
        // Append any DB-only tags that aren't in the catalog yet
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
      tags: [...allTags].sort(),
    };
  }

  private getProgress(questions: { userAnswer: string | null }[]) {
    const answered = questions.filter((q) => q.userAnswer !== null).length;
    return { answered, total: questions.length };
  }
}
