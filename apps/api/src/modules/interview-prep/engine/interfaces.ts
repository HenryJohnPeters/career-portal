/**
 * Data shapes for the deterministic interview engine (no AI, no DB access).
 */

export interface RubricCriterion {
  name: string;
  weight: number;
  keywords: string[];
}

/** The light bank-question fields used to pick a session's questions. */
export interface CandidateQuestion {
  id: string;
  type: string;
  difficulty: number;
  tags: string[];
}

/** The bank-question fields needed to grade an answer. */
export interface GradableQuestion {
  options: string[];
  correctOptionIndex: number;
  correctOptionIndices: number[];
  multiSelect: boolean;
  expectedPoints: string[];
  rubric: { criteria: RubricCriterion[] };
  modelAnswer: string;
}

export interface SelectionSettings {
  level: string;
  difficulty: string;
  tags: string[];
  questionCount: number;
  roleFocus: string;
  interviewType: string;
}

export interface EvaluationResult {
  isCorrect: boolean;
  /** 0 or `maxScore` (all-or-nothing, including multi-select). */
  score: number;
  maxScore: number;
  pointsHit: string[];
  pointsMissed: string[];
  redFlagsTriggered: string[];
  criteriaScores: { name: string; score: number; maxScore: number }[];
  suggestions: string[];
  correctAnswer: string;
  correctOptionIndex: number;
  correctOptionIndices: number[];
  selectedOptionIndex: number;
  selectedOptionIndices: number[];
}
