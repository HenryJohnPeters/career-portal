import { AlertCircle, Check, Loader2 } from "lucide-react";
import type { AutosaveStatus } from "../lib/draft-autosaver";

/** Autosave indicator: Saving… / Saved / Save failed (with Retry). Announced politely. */
export function SaveStatus({
  status,
  error,
  onRetry,
  idleLabel,
  className = "",
}: {
  status: AutosaveStatus;
  error?: string | null;
  onRetry?: () => void;
  /** Shown when nothing is happening, e.g. "Auto-saves as you type". */
  idleLabel?: string;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={`flex items-center gap-1.5 text-[11px] font-medium ${className}`}>
      {(status === "pending" || status === "saving") && (
        <span className="flex items-center gap-1.5 text-accent-dark dark:text-accent">
          <Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          Saving…
        </span>
      )}
      {status === "saved" && (
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <Check className="h-3 w-3" aria-hidden="true" />
          Saved
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{error ? `Not saved: ${error}` : "Save failed"}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
            >
              Retry
            </button>
          )}
        </span>
      )}
      {status === "idle" && idleLabel && <span className="text-text-tertiary">{idleLabel}</span>}
    </div>
  );
}
