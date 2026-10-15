import type { TechnicalTest } from "@prisma/client";
import { clampPercentage } from "../../common/grade.util";
import { readEvaluation } from "./technical-tests.rules";
import type {
  StoredEvaluation,
  TechnicalTestSummary,
  TechnicalTestView,
} from "./technical-tests.types";

/** Row shape of the summary list query (JSON fields extracted in SQL). */
export interface TechnicalTestSummaryRow {
  id: string;
  title: string;
  track: string;
  level: string;
  difficulty: string;
  roleFocus: string;
  tags: string[];
  timeLimit: number;
  status: string;
  createdAt: Date;
  startedAt: Date | null;
  submittedAt: Date | null;
  score: number | null;
  grade: string | null;
  hasAiReview: boolean | null;
}

export function toSummary(row: TechnicalTestSummaryRow): TechnicalTestSummary {
  const score =
    typeof row.score === "number" && Number.isFinite(row.score)
      ? Math.round(clampPercentage(row.score))
      : null;
  return {
    id: row.id,
    title: row.title,
    track: row.track,
    level: row.level,
    difficulty: row.difficulty,
    roleFocus: row.roleFocus,
    tags: row.tags ?? [],
    timeLimit: row.timeLimit,
    status: row.status,
    createdAt: row.createdAt,
    startedAt: row.startedAt,
    submittedAt: row.submittedAt,
    score,
    grade: score === null ? null : row.grade,
    hasAiReview: row.hasAiReview === true,
  };
}

/** Evaluation as returned to the client: internal bookkeeping removed. */
function publicEvaluation(
  evaluation: StoredEvaluation | null,
): TechnicalTestView["evaluation"] {
  if (!evaluation) return null;
  const { aiReviewPendingSince: _pending, ...rest } = evaluation;
  return rest;
}

/** Full test for GET /:id and mutation responses (never includes `deletedAt`). */
export function toTestView(test: TechnicalTest): TechnicalTestView {
  const { deletedAt: _deletedAt, evaluation, ...rest } = test;
  return { ...rest, evaluation: publicEvaluation(readEvaluation(evaluation)) };
}
