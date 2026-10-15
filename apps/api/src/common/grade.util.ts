/**
 * Converts a percentage score (0–100) to a letter grade.
 * Used by both the interview report generator and technical-test evaluator.
 */
export function computeGrade(percentage: number): string {
  const pct = clampPercentage(percentage);
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

/** Clamps to [0, 100]; non-finite input becomes 0. */
export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/** Clamps a per-question score to [0, maxScore]; non-finite input becomes 0. */
export function clampScore(score: number, maxScore: number): number {
  if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
    return 0;
  }
  return Math.min(maxScore, Math.max(0, score));
}

/** `score / max` as a whole-number percentage in [0, 100]; 0 when max is 0. */
export function toPercentage(score: number, max: number): number {
  if (!Number.isFinite(score) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.round(clampPercentage((score / max) * 100));
}
