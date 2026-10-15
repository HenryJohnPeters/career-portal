import type { AnswerFeedback, InterviewSessionSummary } from "@careerportal/shared/types";

/*
 * Pure helpers for answering questions and recovering sessions (unit-tested
 * in answer.spec.ts).
 */

/** "A", "B", … for option index 0, 1, … */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

/** "A, C" for [0, 2]. */
export function formatOptionLetters(indices: readonly number[]): string {
  return [...indices].sort((a, b) => a - b).map(optionLetter).join(", ");
}

/** Single choice replaces the selection; multi-select toggles the index. */
export function toggleChoice(selected: readonly number[], index: number, multiSelect: boolean): number[] {
  if (!multiSelect) return [index];
  return selected.includes(index)
    ? selected.filter((i) => i !== index)
    : [...selected, index].sort((a, b) => a - b);
}

/** The API answer string: "2", or comma-separated sorted indices for multi-select ("0,2"). */
export function encodeAnswer(selected: readonly number[]): string {
  return [...new Set(selected)]
    .filter((i) => Number.isInteger(i) && i >= 0)
    .sort((a, b) => a - b)
    .join(",");
}

export function correctIndicesOf(feedback: AnswerFeedback): number[] {
  if (feedback.correctOptionIndices && feedback.correctOptionIndices.length > 0) {
    return feedback.correctOptionIndices;
  }
  return feedback.correctOptionIndex >= 0 ? [feedback.correctOptionIndex] : [];
}

export function selectedIndicesOf(feedback: AnswerFeedback): number[] {
  if (feedback.selectedOptionIndices && feedback.selectedOptionIndices.length > 0) {
    return feedback.selectedOptionIndices;
  }
  return feedback.selectedOptionIndex >= 0 ? [feedback.selectedOptionIndex] : [];
}

/** How far apart the server's and the browser's clocks may plausibly be. */
const CLOCK_SKEW_MS = 2 * 60_000;

/**
 * After "Start" timed out, find the session the server created anyway: an
 * in-progress session with the requested track/level that is new since the
 * click (not in `knownIds` when the list was loaded, else created after
 * `since` give or take clock skew). Newest first, as the API returns them.
 */
export function findRecoveredSession(
  sessions: readonly InterviewSessionSummary[],
  request: { track: string; level: string; since: number; knownIds: ReadonlySet<string> | null },
): InterviewSessionSummary | null {
  return (
    sessions.find((s) => {
      if (s.status !== "in_progress" || s.track !== request.track || s.level !== request.level) {
        return false;
      }
      if (request.knownIds) return !request.knownIds.has(s.id);
      const created = Date.parse(s.createdAt);
      return Number.isFinite(created) && created >= request.since - CLOCK_SKEW_MS;
    }) ?? null
  );
}
