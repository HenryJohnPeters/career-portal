import {
  IAnswerEvaluator,
  QuestionRecord,
  EvaluationResult,
} from "./interfaces";

/**
 * Rule-based answer evaluator using keyword matching and weighted rubric criteria.
 * This is the v1 "FakeAI" — deterministic, testable, no external calls.
 * In v2, replace with AIEvaluator implementing the same IAnswerEvaluator interface.
 */
export class RuleBasedEvaluator implements IAnswerEvaluator {
  evaluate(question: QuestionRecord, userAnswer: string): EvaluationResult {
    const options = (question.options ?? []) as string[];
    const correctIdx = question.correctOptionIndex ?? 0;
    const correctAnswer = options[correctIdx] ?? question.modelAnswer;
    const selectedIdx = parseInt(userAnswer, 10);
    const isCorrect = selectedIdx === correctIdx;

    // For multiple choice: full marks if correct, zero if wrong
    const criteria = question.rubric?.criteria ?? [];
    let totalWeight = 0;
    for (const c of criteria) totalWeight += c.weight;
    const maxScore = totalWeight > 0 ? totalWeight * 10 : 10;
    const finalScore = isCorrect ? maxScore : 0;

    const criteriaScores: EvaluationResult["criteriaScores"] = criteria.map(
      (c) => ({
        name: c.name,
        score: isCorrect ? c.weight * 10 : 0,
        maxScore: c.weight * 10,
      })
    );

    const pointsHit = isCorrect ? [...question.expectedPoints] : [];
    const pointsMissed = isCorrect ? [] : [...question.expectedPoints];
    const redFlagsTriggered: string[] = [];

    const suggestions = isCorrect
      ? ["Great job! You selected the correct answer."]
      : [
          `The correct answer was: "${correctAnswer}". Review the model answer for more detail.`,
        ];

    return {
      score: finalScore,
      maxScore,
      pointsHit,
      pointsMissed,
      redFlagsTriggered,
      criteriaScores,
      suggestions,
      correctAnswer,
      correctOptionIndex: correctIdx,
      selectedOptionIndex: selectedIdx,
      isCorrect,
    };
  }
}
