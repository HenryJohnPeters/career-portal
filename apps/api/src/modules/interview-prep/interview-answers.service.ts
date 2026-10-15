import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { QuotaExceededException } from "../../common/errors";
import { getMonthWindow, lockedTransaction, userLockKey } from "../../common/plan";
import { EntitlementsService } from "../entitlements/entitlements.service";
import {
  MAX_FOLLOW_UPS_PER_SESSION,
  correctIndicesOf,
  evaluateAnswer,
  fiftyFiftyEliminated,
  parseAnswer,
  personaResponse,
  pickFollowUp,
  shouldFollowUp,
  type EvaluationResult,
} from "./engine";
import {
  SESSION_QUESTION_SELECT,
  toClientSessionQuestion,
  toGradableQuestion,
  toInputJson,
  toJsonValue,
  type ClientSessionQuestion,
} from "./interview-view";
import { getInterviewerTraits } from "./interviewer-traits";
import { InterviewSessionsService } from "./interview-sessions.service";
import { QUESTION_MAX_SCORE } from "./interview-rules";

/** Stored on InterviewSessionQuestion.feedback and returned with the answer. */
export interface AnswerFeedback {
  pointsHit: string[];
  pointsMissed: string[];
  redFlagsTriggered: string[];
  criteriaScores: { name: string; score: number; maxScore: number }[];
  suggestions: string[];
  personaResponse: string;
  correctAnswer: string;
  correctOptionIndex: number;
  correctOptionIndices: number[];
  selectedOptionIndex: number;
  selectedOptionIndices: number[];
  isCorrect: boolean;
}

export interface NextQuestionResult {
  sessionQuestion: ClientSessionQuestion | null;
  sessionStatus: "in_progress" | "completed";
  progress: { answered: number; total: number };
}

export interface SubmitAnswerResult {
  answered: ClientSessionQuestion;
  followUp: ClientSessionQuestion | null;
  feedback: AnswerFeedback;
}

const ALREADY_ANSWERED = "This question has already been answered.";
const SESSION_FINISHED = "This interview is already finished.";

/** Asking and answering: the next question, grading, follow-ups and auto-completion. */
@Injectable()
export class InterviewAnswersService {
  private readonly logger = new Logger(InterviewAnswersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly sessions: InterviewSessionsService,
  ) {}

  /** The first unanswered question (answer key stripped) and progress; resumes in-progress sessions. */
  async getNextQuestion(userId: string, sessionId: string): Promise<NextQuestionResult> {
    const session = await this.prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
      select: {
        status: true,
        interviewerId: true,
        questions: {
          select: { id: true, userAnswer: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });
    if (!session) throw new NotFoundException("Session not found");

    const total = session.questions.length;
    const answered = session.questions.filter((q) => q.userAnswer !== null).length;
    const progress = { answered, total };
    const nextId = session.questions.find((q) => q.userAnswer === null)?.id;

    if (session.status === "completed" || !nextId) {
      // Every question answered but never completed (e.g. a failed request): finish it now.
      if (session.status !== "completed" && answered > 0) {
        await this.sessions.finishSession(userId, sessionId);
      }
      return { sessionQuestion: null, sessionStatus: "completed", progress };
    }

    const row = await this.prisma.interviewSessionQuestion.findUnique({
      where: { id: nextId },
      select: SESSION_QUESTION_SELECT,
    });
    if (!row) throw new NotFoundException("Session question not found");

    const sessionQuestion = toClientSessionQuestion(row);
    if (getInterviewerTraits(session.interviewerId)?.fiftyFifty && !row.question.multiSelect) {
      const gradable = toGradableQuestion(row.question);
      const eliminated = fiftyFiftyEliminated(
        row.id,
        gradable.options.length,
        correctIndicesOf(gradable),
      );
      if (eliminated) sessionQuestion.fiftyFiftyEliminated = eliminated;
    }
    return { sessionQuestion, sessionStatus: "in_progress", progress };
  }

  /**
   * Grades and stores one answer. 409 when the question was already answered
   * or the session is finished; the write is conditional, so concurrent
   * submits cannot both succeed. Free plans: the monthly question quota is
   * checked under the per-user lock.
   */
  async submitAnswer(
    userId: string,
    sessionId: string,
    sessionQuestionId: string,
    answer: string,
  ): Promise<SubmitAnswerResult> {
    const sq = await this.prisma.interviewSessionQuestion.findFirst({
      where: { id: sessionQuestionId, sessionId, session: { userId } },
      select: {
        ...SESSION_QUESTION_SELECT,
        session: { select: { status: true, interviewerId: true, persona: true } },
      },
    });
    if (!sq) throw new NotFoundException("Session question not found");
    if (sq.session.status === "completed") throw new ConflictException(SESSION_FINISHED);
    if (sq.userAnswer !== null) throw new ConflictException(ALREADY_ANSWERED);

    const question = toGradableQuestion(sq.question);
    const parsed = parseAnswer(answer, {
      optionCount: question.options.length,
      multiSelect: question.multiSelect,
    });
    if (!parsed.ok) throw new BadRequestException(parsed.message);

    const evaluation = evaluateAnswer(question, parsed.indices, sq.maxScore || QUESTION_MAX_SCORE);
    const traits = getInterviewerTraits(sq.session.interviewerId);
    const feedback = toFeedback(
      evaluation,
      personaResponse(
        traits?.persona ?? sq.session.persona,
        evaluation.isCorrect,
        evaluation.pointsMissed,
        traits?.adviceLevel ?? "standard",
      ),
    );

    const plan = await this.entitlements.getPlan(userId);
    const questionLimit = plan.limits.monthlyQuestions;
    const { start: monthStart, nextStart } = getMonthWindow();
    const answeredAt = new Date();
    const userAnswer = parsed.indices.join(",");

    const { followUp, finished, orderIndex } = await lockedTransaction(
      this.prisma,
      userLockKey("interview", userId),
      async (tx) => {
        if (questionLimit !== null) {
          const used = await tx.interviewSessionQuestion.count({
            where: { session: { userId }, answeredAt: { gte: monthStart } },
          });
          if (used >= questionLimit) {
            throw new QuotaExceededException("questions", questionLimit, used, nextStart);
          }
        }

        const { count } = await tx.interviewSessionQuestion.updateMany({
          where: {
            id: sq.id,
            userAnswer: null,
            session: { id: sessionId, userId, status: "in_progress" },
          },
          data: {
            userAnswer,
            score: evaluation.score,
            feedback: toInputJson(feedback),
            answeredAt,
          },
        });
        if (count === 0) throw new ConflictException(ALREADY_ANSWERED);

        let created = null;
        // Re-read under the lock: an earlier follow-up may have shifted this question.
        let parentOrder = sq.orderIndex;
        if (shouldFollowUp(evaluation.isCorrect, sq.question.followUpIds)) {
          const inSession = await tx.interviewSessionQuestion.findMany({
            where: { sessionId },
            select: { id: true, questionId: true, isFollowUp: true, orderIndex: true },
          });
          parentOrder = inSession.find((r) => r.id === sq.id)?.orderIndex ?? sq.orderIndex;
          const followUps = inSession.filter((r) => r.isFollowUp).length;
          const used = new Set(inSession.map((r) => r.questionId));
          const ids = sq.question.followUpIds.filter((id) => !used.has(id));
          if (followUps < MAX_FOLLOW_UPS_PER_SESSION && ids.length > 0) {
            const candidates = await tx.interviewQuestion.findMany({
              where: { id: { in: ids } },
              select: { id: true, expectedPoints: true },
            });
            const followUpId = pickFollowUp(ids, evaluation.pointsMissed, candidates);
            if (followUpId) {
              // Ask it straight after the question it follows.
              await tx.interviewSessionQuestion.updateMany({
                where: { sessionId, orderIndex: { gt: parentOrder } },
                data: { orderIndex: { increment: 1 } },
              });
              created = await tx.interviewSessionQuestion.create({
                data: {
                  sessionId,
                  questionId: followUpId,
                  orderIndex: parentOrder + 1,
                  maxScore: QUESTION_MAX_SCORE,
                  isFollowUp: true,
                  parentQuestionId: sq.questionId,
                },
                select: SESSION_QUESTION_SELECT,
              });
              await tx.interviewSession.update({
                where: { id: sessionId },
                data: { questionCount: { increment: 1 } },
              });
            }
          }
        }

        const remaining = await tx.interviewSessionQuestion.count({
          where: { sessionId, userAnswer: null },
        });
        return { followUp: created, finished: remaining === 0, orderIndex: parentOrder };
      },
    );

    if (finished) {
      // The answer is saved either way; GET …/next completes the session if this fails.
      await this.sessions.finishSession(userId, sessionId).catch((error: unknown) =>
        this.logger.warn(
          `Completing session after the last answer failed: ${error instanceof Error ? error.name : "unknown error"}`,
        ),
      );
    }

    const { session: _session, ...row } = sq;
    return {
      answered: toClientSessionQuestion({
        ...row,
        orderIndex,
        userAnswer,
        score: evaluation.score,
        feedback: toJsonValue(feedback),
        answeredAt,
      }),
      followUp: followUp ? toClientSessionQuestion(followUp) : null,
      feedback,
    };
  }
}

function toFeedback(evaluation: EvaluationResult, response: string): AnswerFeedback {
  return {
    pointsHit: evaluation.pointsHit,
    pointsMissed: evaluation.pointsMissed,
    redFlagsTriggered: evaluation.redFlagsTriggered,
    criteriaScores: evaluation.criteriaScores,
    suggestions: evaluation.suggestions,
    personaResponse: response,
    correctAnswer: evaluation.correctAnswer,
    correctOptionIndex: evaluation.correctOptionIndex,
    correctOptionIndices: evaluation.correctOptionIndices,
    selectedOptionIndex: evaluation.selectedOptionIndex,
    selectedOptionIndices: evaluation.selectedOptionIndices,
    isCorrect: evaluation.isCorrect,
  };
}
