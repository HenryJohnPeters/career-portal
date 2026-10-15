import { createHash } from "crypto";

/**
 * The 50/50 hint: two wrong options to strike out. Derived from `seed` (the
 * session-question id), so every request for the same question returns the
 * same pair and repeated calls reveal nothing more. Only for single-answer
 * questions with at least 4 options; null otherwise.
 */
export function fiftyFiftyEliminated(
  seed: string,
  optionCount: number,
  correctIndices: readonly number[],
): number[] | null {
  if (optionCount < 4 || correctIndices.length !== 1) return null;
  const wrong = Array.from({ length: optionCount }, (_, i) => i).filter(
    (i) => !correctIndices.includes(i),
  );
  if (wrong.length < 2) return null;

  const bytes = createHash("sha256").update(seed).digest();
  for (let i = wrong.length - 1; i > 0; i--) {
    const j = bytes[i % bytes.length] % (i + 1);
    [wrong[i], wrong[j]] = [wrong[j], wrong[i]];
  }
  return wrong.slice(0, 2).sort((a, b) => a - b);
}
