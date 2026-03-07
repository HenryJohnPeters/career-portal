/**
 * Converts a percentage score (0–100) to a letter grade.
 * Used by both the interview report generator and technical-test evaluator.
 */
export function computeGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}
