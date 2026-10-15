import type { Timers } from "./draft-autosaver";

/** Deterministic timers for specs: callbacks run only when `advance()` passes their time. */
export function createFakeTimers() {
  let now = 0;
  let nextId = 1;
  const scheduled = new Map<number, { at: number; callback: () => void }>();

  const timers: Timers = {
    setTimeout(callback, ms) {
      const id = nextId++;
      scheduled.set(id, { at: now + ms, callback });
      return id;
    },
    clearTimeout(handle) {
      scheduled.delete(handle as number);
    },
  };

  /** Move the clock forward, running due callbacks in order. */
  function advance(ms: number): void {
    const target = now + ms;
    for (;;) {
      let nextKey: number | null = null;
      let nextAt = Infinity;
      for (const [id, entry] of scheduled) {
        if (entry.at <= target && entry.at < nextAt) {
          nextAt = entry.at;
          nextKey = id;
        }
      }
      if (nextKey === null) break;
      const entry = scheduled.get(nextKey)!;
      scheduled.delete(nextKey);
      now = entry.at;
      entry.callback();
    }
    now = target;
  }

  return { timers, advance, pending: () => scheduled.size };
}

/** Let queued promise callbacks run. */
export async function settle(rounds = 10): Promise<void> {
  for (let i = 0; i < rounds; i++) await Promise.resolve();
}
