/**
 * Single sink for unexpected client errors (render crashes, failed requests
 * that are not the user's fault). It only logs today; wire a monitoring
 * service in here so every caller reports through it.
 */
export function reportError(
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  console.error("[careerRepo] unexpected error", error, context);
}
