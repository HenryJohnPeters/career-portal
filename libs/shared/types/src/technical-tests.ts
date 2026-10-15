// === Technical tests (PLAN §2.10) ===
import type {
  InterviewDifficulty,
  InterviewLevel,
  InterviewRoleFocus,
} from "./interview";

/** "evaluated" is legacy and no longer produced by the API. */
export type TechnicalTestStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "evaluated";

export interface TechTestScenario {
  title: string;
  companyContext: string;
  brief: string;
  background: string;
  requirements: { key: string; text: string }[];
  nonFunctional: string[];
  acceptanceCriteria: string[];
  bonusChallenges: string[];
  evaluationCriteria: { name: string; weight: number; description: string }[];
  hints: string[];
  estimatedTime: string;
  deliverables: string[];
  constraints: string[];
}

export type TechTestRating = 0 | 1 | 2 | 3;

export interface TechTestSelfReviewRating {
  /** Index into `scenario.evaluationCriteria`. */
  criterionIndex: number;
  score: TechTestRating;
}

/** PUT /technical-tests/:id/self-review (free). */
export interface TechTestSelfReviewRequest {
  ratings: TechTestSelfReviewRating[];
  /** ≤5000 characters. */
  notes?: string;
}

/** Stored as `evaluation.selfReview`. */
export interface TechTestSelfReview extends TechTestSelfReviewRequest {
  reviewedAt: string;
}

/** Stored as `evaluation.aiReview` by POST /technical-tests/:id/ai-review (Premium, once per test). */
export interface TechTestAiReview {
  summary: string;
  strengths: string[];
  improvements: string[];
  criteria: { criterion: string; score: TechTestRating; comment: string }[];
  reviewedAt: string;
}

/**
 * Heuristic "self-check" computed on submit (keyword coverage against the
 * brief) — not a grade. Self/AI reviews are attached once they exist.
 */
export interface TechTestEvaluation {
  overallScore: number;
  maxPossible: number;
  percentage: number;
  grade: string;
  criteriaScores: {
    name: string;
    score: number;
    maxScore: number;
    description: string;
  }[];
  strengths: string[];
  improvements: string[];
  requirementsCovered: number;
  requirementsTotal: number;
  requirementsMissed: string[];
  wordCount: number;
  summary: string;
  selfReview?: TechTestSelfReview | null;
  aiReview?: TechTestAiReview | null;
}

/** GET /technical-tests/:id and the start/submit/review responses. */
export interface TechnicalTest {
  id: string;
  userId: string;
  title: string;
  track: string;
  level: string;
  difficulty: string;
  roleFocus: string;
  tags: string[];
  scenario: TechTestScenario;
  status: TechnicalTestStatus;
  submission: string | null;
  evaluation: TechTestEvaluation | null;
  /** Suggested time in minutes (soft timer; never auto-submits). */
  timeLimit?: number;
  startedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /technical-tests — ≤100, newest first, soft-deleted tests excluded. */
export interface TechnicalTestSummary {
  id: string;
  title: string;
  track: string;
  level: string;
  difficulty: string;
  roleFocus: string;
  tags: string[];
  timeLimit: number;
  status: TechnicalTestStatus;
  createdAt: string;
  startedAt: string | null;
  submittedAt: string | null;
  score: number | null;
  grade: string | null;
  hasAiReview: boolean;
}

export interface CreateTechnicalTestRequest {
  roleFocus: InterviewRoleFocus;
  level: InterviewLevel;
  difficulty: InterviewDifficulty;
  /** Canonical TECH_TAG_CATALOG ids (see normalizeTag); ≤12, unique. */
  tags: string[];
}

/** POST /technical-tests/:id/submit — 1..100000 characters. */
export interface SubmitTechnicalTestRequest {
  submission: string;
}
