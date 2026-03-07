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
import { TECH_CATEGORIES } from "../../common/constants";

// Feedback interface — exported so the controller return type is resolvable
export interface AnswerFeedback {
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
    private readonly aiQuestionGenerator: AiQuestionGeneratorService
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
    const questionCount = dto.questionCount ?? 10;
    const persona = dto.persona ?? "neutral";
    const roleFocus = dto.roleFocus ?? "fullstack";
    const interviewType = dto.interviewType ?? "coding";
    const duration = dto.duration ?? 60;
    const difficulty = dto.difficulty ?? "medium";
    const companyStyle = dto.companyStyle ?? "startup";

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
        // Use the urgent path — bypasses normal cooldown / daily limits
        // so the user never gets a session with 0 questions.
        await this.aiQuestionGenerator.ensurePoolForFiltersUrgent(poolFilters);
      } catch {
        // Non-critical — proceed with whatever we have
      }

      // If the pool is STILL empty after urgent generation, try without
      // tags so the selector at least has *something* to work with.
      const poolSizeAfter = await this.aiQuestionGenerator.getPoolSize(
        poolFilters
      );
      if (poolSizeAfter === 0 && tags.length > 0) {
        try {
          await this.aiQuestionGenerator.ensurePoolForFiltersUrgent({
            ...poolFilters,
            tags: [],
          });
        } catch {
          // Non-critical
        }
      }
    }

    // Load entire question pool from the bank
    const pool = await this.prisma.interviewQuestion.findMany();
    const poolRecords: QuestionRecord[] = pool.map((q) => ({
      ...q,
      options: (q.options as unknown as string[]) ?? undefined,
      rubric: q.rubric as unknown as QuestionRecord["rubric"],
    }));

    // Select questions using the adaptive algorithm
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
      [],
      []
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
        status: "in_progress",
        questions: {
          create: selected.map((q, idx) => ({
            questionId: q.id,
            orderIndex: idx,
            maxScore: 10,
            isFollowUp: false,
          })),
        },
      },
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
    return {
      sessionQuestion: next ?? null,
      sessionStatus: next ? "in_progress" : "completed",
      progress: this.getProgress(session.questions),
    };
  }

  /** Submit an answer, evaluate it, possibly inject a follow-up */
  async submitAnswer(
    userId: string,
    sessionId: string,
    sessionQuestionId: string,
    answer: string
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

    // Generate persona response
    const personaResponse = this.personaResponder.respond(
      session.persona,
      evaluation.score,
      evaluation.maxScore,
      evaluation.pointsMissed
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
      const pool = await this.prisma.interviewQuestion.findMany();
      const poolRecords: QuestionRecord[] = pool.map((q) => ({
        ...q,
        options: (q.options as unknown as string[]) ?? undefined,
        rubric: q.rubric as unknown as QuestionRecord["rubric"],
      }));

      const followUpQuestion = this.followUpStrategy.selectFollowUp(
        questionRecord,
        evaluation,
        poolRecords
      );

      if (followUpQuestion) {
        const maxOrder = Math.max(
          ...session.questions.map((q) => q.orderIndex)
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
      (q) => q.userAnswer !== null
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
      scoredQuestions
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
    if (user?.isPremium) {
      this.aiQuestionGenerator
        .maybePiggybackGenerate(
          {
            track: session.track,
            level: session.level,
            difficulty: session.difficulty,
            tags: session.tags,
          },
          userId
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
