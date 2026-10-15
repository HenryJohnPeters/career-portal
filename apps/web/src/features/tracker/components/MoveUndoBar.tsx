import { useEffect, useState } from "react";
import { Undo2, X } from "lucide-react";
import type { JobStatus } from "@careerportal/shared/types";
import { statusLabel } from "../constants";

export interface LastMove {
  /** Distinguishes repeated moves of the same job (restarts the timer). */
  key: number;
  jobId: string;
  company: string;
  from: JobStatus;
  to: JobStatus;
}

const VISIBLE_MS = 8000;

/** "Moved Acme to Applied · Undo" after a drag; disappears after a few seconds. */
export function MoveUndoBar({
  move,
  onUndo,
  onDismiss,
}: {
  move: LastMove | null;
  onUndo: (move: LastMove) => void;
  onDismiss: () => void;
}) {
  // Held open while hovered or focused, so there is time to reach "Undo".
  const [paused, setPaused] = useState(false);
  const moveKey = move?.key;
  useEffect(() => setPaused(false), [moveKey]);
  useEffect(() => {
    if (!move || paused) return;
    const timer = setTimeout(onDismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [move, paused, onDismiss]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      {move && (
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          className="pointer-events-auto flex items-center gap-3 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900 animate-slide-up">
          <span>
            Moved <span className="font-semibold">{move.company}</span> to {statusLabel(move.to)}.
          </span>
          <button
            type="button"
            onClick={() => onUndo(move)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-primary-300 hover:bg-white/10 dark:text-primary-700 dark:hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            Undo
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="rounded-md p-1 opacity-70 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
