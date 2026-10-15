import { clampScore } from "../../../common/grade.util";
import type { EvaluationResult, GradableQuestion } from "./interfaces";

/** Up to this many indices in one answer ("0,2,3"). */
const MAX_SELECTED = 20;
const ANSWER_PATTERN = /^\s*\d{1,2}\s*(,\s*\d{1,2}\s*)*$/;

export type ParsedAnswer =
  | { ok: true; indices: number[] }
  | { ok: false; message: string };

/**
 * Parses an option answer: "2", or comma-separated indices for multi-select
 * ("0,2"). Indices come back sorted and de-duplicated. Rejects junk ("0abc"),
 * out-of-range indices and several indices for a single-answer question.
 */
export function parseAnswer(
  answer: string,
  question: { optionCount: number; multiSelect: boolean },
): ParsedAnswer {
  if (typeof answer !== "string" || !ANSWER_PATTERN.test(answer)) {
    return { ok: false, message: "Answer with the number of the option you chose." };
  }
  const indices = [...new Set(answer.split(",").map((part) => Number(part.trim())))].sort(
    (a, b) => a - b,
  );
  if (indices.length > MAX_SELECTED || indices.some((i) => i >= question.optionCount)) {
    return { ok: false, message: "That option doesn't exist for this question." };
  }
  if (!question.multiSelect && indices.length !== 1) {
    return { ok: false, message: "Choose exactly one option for this question." };
  }
  return { ok: true, indices };
}

/** Every correct option index, sorted (single-answer questions have one). */
export function correctIndicesOf(question: GradableQuestion): number[] {
  const optionCount = question.options.length;
  const valid = (i: number) => Number.isInteger(i) && i >= 0 && i < optionCount;
  if (question.multiSelect) {
    const indices = [...new Set(question.correctOptionIndices.filter(valid))].sort((a, b) => a - b);
    if (indices.length > 0) return indices;
  }
  return valid(question.correctOptionIndex) ? [question.correctOptionIndex] : [];
}

/**
 * Deterministic grading for option questions. All-or-nothing: the answer is
 * correct only when the selected set equals the correct set, and scores
 * either 0 or `maxScore`.
 */
export function evaluateAnswer(
  question: GradableQuestion,
  selected: readonly number[],
  maxScore: number,
): EvaluationResult {
  const correct = correctIndicesOf(question);
  const chosen = [...new Set(selected)].sort((a, b) => a - b);
  const isCorrect =
    correct.length > 0 &&
    correct.length === chosen.length &&
    correct.every((index, i) => index === chosen[i]);
  const score = clampScore(isCorrect ? maxScore : 0, maxScore);

  const criteria = question.rubric.criteria.filter((c) => c.weight > 0);
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const criteriaScores = criteria.map((c) => {
    const criterionMax = round1((c.weight / totalWeight) * maxScore);
    return { name: c.name, score: isCorrect ? criterionMax : 0, maxScore: criterionMax };
  });

  const correctAnswer =
    correct.map((i) => question.options[i]).join(", ") || question.modelAnswer;
  const suggestions = [
    isCorrect
      ? question.multiSelect
        ? "Great job! You found every correct option."
        : "Great job! You selected the correct answer."
      : question.multiSelect
        ? `The correct options were: ${correctAnswer}.`
        : `The correct answer was: "${correctAnswer}".`,
  ];
  if (question.modelAnswer.trim()) suggestions.push(question.modelAnswer.trim());

  return {
    isCorrect,
    score,
    maxScore,
    pointsHit: isCorrect ? [...question.expectedPoints] : [],
    pointsMissed: isCorrect ? [] : [...question.expectedPoints],
    redFlagsTriggered: [],
    criteriaScores,
    suggestions,
    correctAnswer,
    correctOptionIndex: correct[0] ?? -1,
    correctOptionIndices: correct,
    selectedOptionIndex: chosen[0] ?? -1,
    selectedOptionIndices: chosen,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
