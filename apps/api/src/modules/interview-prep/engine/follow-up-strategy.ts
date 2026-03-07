import {
  IFollowUpStrategy,
  QuestionRecord,
  EvaluationResult,
} from "./interfaces";

/**
 * Determines whether to ask a follow-up and selects the appropriate one.
 * Follow-ups are triggered when the user misses key points (score < 60%).
 */
export class FollowUpStrategy implements IFollowUpStrategy {
  /** Trigger follow-up if score is below 60% of max */
  shouldFollowUp(evaluation: EvaluationResult): boolean {
    if (evaluation.maxScore === 0) return false;
    const ratio = evaluation.score / evaluation.maxScore;
    return ratio < 0.6 && evaluation.pointsMissed.length > 0;
  }

  /**
   * Select a follow-up from the question's declared followUpIds.
   * Prefer follow-ups that target the missed points.
   */
  selectFollowUp(
    question: QuestionRecord,
    evaluation: EvaluationResult,
    pool: QuestionRecord[]
  ): QuestionRecord | null {
    if (question.followUpIds.length === 0) return null;

    const followUpPool = pool.filter((q) =>
      question.followUpIds.includes(q.id)
    );
    if (followUpPool.length === 0) return null;

    // Score each follow-up by how many missed points its expectedPoints cover
    const missedSet = new Set(
      evaluation.pointsMissed.map((p) => p.toLowerCase())
    );

    let best: QuestionRecord | null = null;
    let bestOverlap = -1;

    for (const fq of followUpPool) {
      const overlap = fq.expectedPoints.filter((ep) =>
        missedSet.has(ep.toLowerCase())
      ).length;
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        best = fq;
      }
    }

    // Fall back to the first follow-up if none overlaps with missed points
    return best ?? followUpPool[0];
  }
}
