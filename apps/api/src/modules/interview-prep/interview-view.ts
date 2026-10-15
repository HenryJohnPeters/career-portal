import type { Prisma } from "@prisma/client";
import { clampScore, computeGrade, toPercentage } from "../../common/grade.util";
import {
  correctIndicesOf,
  generateReport,
  type GradableQuestion,
  type RubricCriterion,
  type ScoredQuestion,
} from "./engine";

/*
 * What the API sends about sessions and questions. The answer key of a bank
 * question (correct option(s), model answer, expected points, red flags,
 * rubric) is only ever sent for a question the user has already answered.
 */

/** Bank-question columns loaded for sessions (never `source`/`generatedForHash`). */
export const QUESTION_SELECT = {
  id: true,
  track: true,
  tags: true,
  difficulty: true,
  type: true,
  level: true,
  prompt: true,
  options: true,
  multiSelect: true,
  correctOptionIndex: true,
  correctOptionIndices: true,
  expectedPoints: true,
  redFlags: true,
  rubric: true,
  modelAnswer: true,
  followUpIds: true,
  createdAt: true,
} as const satisfies Prisma.InterviewQuestionSelect;

export const SESSION_QUESTION_SELECT = {
  id: true,
  sessionId: true,
  questionId: true,
  orderIndex: true,
  userAnswer: true,
  score: true,
  maxScore: true,
  feedback: true,
  isFollowUp: true,
  parentQuestionId: true,
  answeredAt: true,
  createdAt: true,
  question: { select: QUESTION_SELECT },
} as const satisfies Prisma.InterviewSessionQuestionSelect;

export const SESSION_QUESTIONS_INCLUDE = {
  questions: {
    select: SESSION_QUESTION_SELECT,
    orderBy: { orderIndex: "asc" },
  },
} as const satisfies Prisma.InterviewSessionInclude;

export type BankQuestionRow = Prisma.InterviewQuestionGetPayload<{
  select: typeof QUESTION_SELECT;
}>;
export type SessionQuestionRow = Prisma.InterviewSessionQuestionGetPayload<{
  select: typeof SESSION_QUESTION_SELECT;
}>;
export type SessionRow = Prisma.InterviewSessionGetPayload<{
  include: typeof SESSION_QUESTIONS_INCLUDE;
}>;

export interface ClientQuestion {
  id: string;
  track: string;
  tags: string[];
  difficulty: number;
  type: string;
  level: string;
  prompt: string;
  options: string[];
  multiSelect: boolean;
  /** Always empty: links between bank questions stay internal. */
  followUpIds: string[];
  createdAt: Date;
  correctOptionIndex?: number;
  correctOptionIndices?: number[];
  expectedPoints?: string[];
  redFlags?: string[];
  rubric?: { criteria: RubricCriterion[] };
  modelAnswer?: string;
}

export type ClientSessionQuestion = Omit<SessionQuestionRow, "question"> & {
  question: ClientQuestion;
  fiftyFiftyEliminated?: number[] | null;
};

export type ClientSession = Omit<SessionRow, "questions"> & {
  questions: ClientSessionQuestion[];
};

export function toClientQuestion(row: BankQuestionRow, revealAnswerKey: boolean): ClientQuestion {
  const base: ClientQuestion = {
    id: row.id,
    track: row.track,
    tags: row.tags,
    difficulty: row.difficulty,
    type: row.type,
    level: row.level,
    prompt: row.prompt,
    options: parseOptions(row.options),
    multiSelect: row.multiSelect,
    followUpIds: [],
    createdAt: row.createdAt,
  };
  if (!revealAnswerKey) return base;
  const gradable = toGradableQuestion(row);
  const correct = correctIndicesOf(gradable);
  return {
    ...base,
    correctOptionIndex: correct[0] ?? row.correctOptionIndex,
    correctOptionIndices: correct,
    expectedPoints: row.expectedPoints,
    redFlags: row.redFlags,
    rubric: gradable.rubric,
    modelAnswer: row.modelAnswer,
  };
}

/** Answer key only once the question is answered; scores are capped at maxScore. */
export function toClientSessionQuestion(sq: SessionQuestionRow): ClientSessionQuestion {
  return {
    ...sq,
    score: sq.score === null ? null : clampScore(sq.score, sq.maxScore),
    question: toClientQuestion(sq.question, sq.userAnswer !== null),
  };
}

export function toClientSession(session: SessionRow): ClientSession {
  return {
    ...session,
    ...repairLegacyReport(session),
    questions: session.questions.map(toClientSessionQuestion),
  };
}

/** Report input for one answered session question. */
export function toScoredQuestion(sq: {
  questionId: string;
  score: number | null;
  maxScore: number;
  feedback: Prisma.JsonValue | null;
  question: { prompt: string; type: string; tags: string[] };
}): ScoredQuestion {
  return {
    questionId: sq.questionId,
    prompt: sq.question.prompt,
    type: sq.question.type,
    score: sq.score ?? 0,
    maxScore: sq.maxScore,
    pointsMissed: parsePointsMissed(sq.feedback),
    tags: sq.question.tags,
  };
}

/**
 * Sessions completed before scores were capped stored rubric-scale scores
 * (above maxScore), so their report could exceed 100%. Such a report is
 * rebuilt from the answered rows on read; current reports are returned as stored.
 */
function repairLegacyReport(session: SessionRow): Pick<SessionRow, "report" | "totalScore"> {
  const answered = session.questions.filter((q) => q.userAnswer !== null);
  const legacy = answered.some((q) => q.score !== null && (q.score > q.maxScore || q.score < 0));
  if (session.status !== "completed" || !legacy) {
    return { report: session.report, totalScore: session.totalScore };
  }
  const report = generateReport(
    session.track,
    session.level,
    answered.map(toScoredQuestion),
    session.questions.length,
  );
  return { report: toJsonValue(report), totalScore: report.overallScore };
}

export function toGradableQuestion(row: BankQuestionRow): GradableQuestion {
  return {
    options: parseOptions(row.options),
    correctOptionIndex: row.correctOptionIndex,
    correctOptionIndices: row.correctOptionIndices,
    multiSelect: row.multiSelect,
    expectedPoints: row.expectedPoints,
    rubric: { criteria: parseRubricCriteria(row.rubric) },
    modelAnswer: row.modelAnswer,
  };
}

/* ── Session summaries (GET /interview-prep/sessions) ─────────────── */

/** Row of the summary query (see InterviewSessionsService.listSummaries). */
export interface SessionSummaryRow {
  id: string;
  status: string;
  track: string;
  level: string;
  difficulty: string;
  interviewType: string;
  interviewerId: string | null;
  questionCount: number;
  answeredCount: number;
  totalScore: number | null;
  /** Over the answered questions: points scored (each capped at its maxScore) and possible. */
  scored: number;
  possible: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionSummary {
  id: string;
  status: string;
  track: string;
  level: string;
  difficulty: string;
  interviewType: string;
  interviewerId: string | null;
  questionCount: number;
  answeredCount: number;
  totalScore: number | null;
  percentage: number | null;
  grade: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Completed sessions are scored from their answered rows, as the report is,
 * so legacy rows stored on the old rubric scale cannot exceed 100%.
 */
export function toSessionSummary(row: SessionSummaryRow): SessionSummary {
  const scored = Number(row.scored);
  const possible = Number(row.possible);
  const hasScore = row.status === "completed" && Number.isFinite(scored) && possible > 0;
  const percentage = hasScore ? toPercentage(scored, possible) : null;
  return {
    id: row.id,
    status: row.status,
    track: row.track,
    level: row.level,
    difficulty: row.difficulty,
    interviewType: row.interviewType,
    interviewerId: row.interviewerId,
    questionCount: row.questionCount,
    answeredCount: Number(row.answeredCount),
    totalScore: hasScore ? Math.round(scored * 10) / 10 : row.totalScore,
    percentage,
    grade: percentage === null ? null : computeGrade(percentage),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/* ── JSON column parsing ──────────────────────────────────────────── */

export function parseOptions(options: Prisma.JsonValue): string[] {
  if (!Array.isArray(options)) return [];
  return options.filter((value): value is string => typeof value === "string");
}

export function parseRubricCriteria(rubric: Prisma.JsonValue): RubricCriterion[] {
  if (!rubric || typeof rubric !== "object" || Array.isArray(rubric)) return [];
  const criteria = (rubric as Record<string, unknown>).criteria;
  if (!Array.isArray(criteria)) return [];
  return criteria.flatMap((item): RubricCriterion[] => {
    if (!item || typeof item !== "object") return [];
    const { name, weight, keywords } = item as Record<string, unknown>;
    if (typeof name !== "string" || typeof weight !== "number" || !Number.isFinite(weight)) return [];
    return [
      {
        name,
        weight,
        keywords: Array.isArray(keywords)
          ? keywords.filter((k): k is string => typeof k === "string")
          : [],
      },
    ];
  });
}

export function parsePointsMissed(feedback: Prisma.JsonValue | null): string[] {
  if (!feedback || typeof feedback !== "object" || Array.isArray(feedback)) return [];
  const points = (feedback as Record<string, unknown>).pointsMissed;
  return Array.isArray(points) ? points.filter((p): p is string => typeof p === "string") : [];
}

/** JSON-safe copy for writing a Prisma Json column. */
export function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/** The same value as a Json column reads back. */
export function toJsonValue(value: unknown): Prisma.JsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.JsonValue;
}
