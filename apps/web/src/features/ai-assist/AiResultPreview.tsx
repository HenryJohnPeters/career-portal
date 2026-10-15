import { Check, RotateCcw, X } from "lucide-react";
import { Button } from "@careerportal/web/ui";

/** An AI result awaiting the user's decision: apply it, regenerate, or discard. */
export function AiResultPreview({
  heading,
  content,
  applyLabel = "Apply",
  replacesText = false,
  regenerating,
  onApply,
  onRegenerate,
  onDiscard,
}: {
  heading: string;
  content: string;
  applyLabel?: string;
  /** Applying replaces existing text (an Undo is offered afterwards). */
  replacesText?: boolean;
  regenerating: boolean;
  onApply: () => void;
  onRegenerate: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          {heading}
        </span>
      </div>
      <pre className="max-h-72 overflow-y-auto rounded-lg border border-accent-muted bg-white dark:bg-gray-800/50 p-3 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-sans">
        {content}
      </pre>
      {replacesText && (
        <p className="text-[10px] text-text-tertiary">
          Applying replaces your current text — you can undo it straight after.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onApply} disabled={regenerating}>
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {applyLabel}
        </Button>
        <Button variant="ghost" size="sm" onClick={onRegenerate} loading={regenerating}>
          {!regenerating && <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
          Regenerate
        </Button>
        <Button variant="ghost" size="sm" onClick={onDiscard} disabled={regenerating}>
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Discard
        </Button>
      </div>
    </div>
  );
}
