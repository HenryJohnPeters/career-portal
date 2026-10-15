export interface SoftTimerState {
  elapsedMs: number;
  limitMs: number | null;
  /** Time left before the suggested limit; 0 once it has passed. */
  remainingMs: number | null;
  overLimit: boolean;
}

/**
 * Elapsed time since the test was started against its suggested time limit.
 * Advisory only: tests are never auto-submitted.
 */
export function getSoftTimer(
  startedAt: string | null | undefined,
  limitMinutes: number | null | undefined,
  now: number,
): SoftTimerState | null {
  const start = startedAt ? Date.parse(startedAt) : NaN;
  if (!Number.isFinite(start)) return null;
  const elapsedMs = Math.max(0, now - start);
  const limitMs = limitMinutes && limitMinutes > 0 ? limitMinutes * 60_000 : null;
  return {
    elapsedMs,
    limitMs,
    remainingMs: limitMs === null ? null : Math.max(0, limitMs - elapsedMs),
    overLimit: limitMs !== null && elapsedMs > limitMs,
  };
}

/** "4:05", "23:12" or "1:05:09". */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${ss}`;
  return `${minutes}:${ss}`;
}

/** Whole words in a submission. */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
