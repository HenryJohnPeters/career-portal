import type { TechnicalTest } from "@prisma/client";
import type { SubmissionEvaluation } from "./engine/self-check";
import type { TechTestScenario } from "./engine/scenario-types";

/*
 * API shapes for technical tests (PLAN §2.10). Mirrors
 * libs/shared/types/src/technical-tests.ts; keep the two in sync.
 */

export type TechTestRating = 0 | 1 | 2 | 3;

export const TECH_TEST_RATINGS: readonly TechTestRating[] = [0, 1, 2, 3];

export interface TechTestSelfReview {
  ratings: { criterionIndex: number; score: TechTestRating }[];
  notes?: string;
  reviewedAt: string;
}

export interface TechTestAiReview {
  summary: string;
  strengths: string[];
  improvements: string[];
  criteria: { criterion: string; score: TechTestRating; comment: string }[];
  reviewedAt: string;
}

/** `TechnicalTest.evaluation`: the submit-time checklist plus the reviews added later. */
export interface StoredEvaluation extends SubmissionEvaluation {
  selfReview?: TechTestSelfReview | null;
  aiReview?: TechTestAiReview | null;
  /** Internal: set while an AI review is running so it is never requested twice. Never returned. */
  aiReviewPendingSince?: string;
}

/** `TechnicalTest.scenario`: the scenario plus where it came from. */
export type StoredScenario = TechTestScenario & {
  source: "template" | "ai";
  /** Static template id (template scenarios only); used to vary the next test. */
  templateId?: string;
};

/** The scenario fields the checklist and AI review need, validated on read. */
export interface ScenarioCore {
  title: string;
  brief: string;
  requirements: { key: string; text: string }[];
  evaluationCriteria: { name: string; weight: number; description?: string }[];
}

/** GET /technical-tests item. */
export interface TechnicalTestSummary {
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
  /** Checklist coverage (0-100) once submitted. */
  score: number | null;
  grade: string | null;
  hasAiReview: boolean;
}

/** GET /technical-tests/:id and every mutation response. */
export type TechnicalTestView = Omit<TechnicalTest, "deletedAt" | "evaluation"> & {
  evaluation: Omit<StoredEvaluation, "aiReviewPendingSince"> | null;
};
