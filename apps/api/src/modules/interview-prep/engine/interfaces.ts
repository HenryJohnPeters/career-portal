/**
 * Core interfaces for the Interview Engine.
 * All business logic depends on these abstractions, never on concrete implementations.
 * In v2, swap RuleBasedEvaluator for AIEvaluator without touching the engine.
 */

export interface RubricCriterion {
  name: string;
  weight: number;
  keywords: string[];
}

export interface EvaluationResult {
  score: number;
  maxScore: number;
  pointsHit: string[];
  pointsMissed: string[];
  redFlagsTriggered: string[];
  criteriaScores: { name: string; score: number; maxScore: number }[];
  suggestions: string[];
  correctAnswer: string;
  correctOptionIndex: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
}

export interface QuestionRecord {
  id: string;
  track: string;
  tags: string[];
  difficulty: number;
  type: string;
  level: string;
  prompt: string;
  options?: string[];
  correctOptionIndex?: number;
  expectedPoints: string[];
  redFlags: string[];
  rubric: { criteria: RubricCriterion[] };
  modelAnswer: string;
  followUpIds: string[];
}

export interface SessionSettings {
  track: string;
  level: string;
  tags: string[];
  questionCount: number;
  persona: string;
  roleFocus: string;
  interviewType: string;
  duration: number;
  difficulty: string;
  companyStyle: string;
}

/** Selects questions from the bank based on session settings and history */
export interface IQuestionSelector {
  select(
    pool: QuestionRecord[],
    settings: SessionSettings,
    answeredIds: string[],
    scores: number[]
  ): QuestionRecord[];
}

/** Evaluates a user's answer against a question's rubric */
export interface IAnswerEvaluator {
  evaluate(question: QuestionRecord, userAnswer: string): EvaluationResult;
}

/** Determines whether and which follow-up to ask */
export interface IFollowUpStrategy {
  shouldFollowUp(evaluation: EvaluationResult): boolean;
  selectFollowUp(
    question: QuestionRecord,
    evaluation: EvaluationResult,
    pool: QuestionRecord[]
  ): QuestionRecord | null;
}

/** Generates persona-flavored responses */
export interface IPersonaResponder {
  respond(
    persona: string,
    score: number,
    maxScore: number,
    pointsMissed: string[]
  ): string;
}
