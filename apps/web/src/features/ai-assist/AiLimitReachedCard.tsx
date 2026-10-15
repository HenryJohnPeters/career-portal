import { useNavigate } from "react-router-dom";
import { Crown, Sparkles, X } from "lucide-react";
import { PREMIUM_PRICE, type UsageMeter } from "@careerportal/shared/types";
import { Button } from "@careerportal/web/ui";
import { formatResetDate } from "../../lib/plan-usage";

/** Shown in place of an AI panel when the free monthly AI allowance is used up. */
export function AiLimitReachedCard({
  meter,
  onClose,
}: {
  meter: UsageMeter | null;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const resets = formatResetDate(meter?.resetsAt);

  return (
    <div
      role="status"
      className="rounded-xl border border-accent-400/30 bg-accent-50 dark:bg-accent-900/20 p-4"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-accent-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider text-accent-700 dark:text-accent-300">
            Monthly AI limit reached
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="text-xs text-accent-800 dark:text-accent-200 leading-relaxed">
        You've used all {meter?.limit ?? "your"} free AI actions this month
        {resets ? ` — they reset on ${resets}` : ""}. Templates, editing, keyword
        match and PDF downloads stay free.
      </p>
      <Button
        size="sm"
        className="mt-3 !bg-accent-400 hover:!bg-accent-500"
        onClick={() => navigate("/app/billing")}
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Upgrade to Premium — {PREMIUM_PRICE.perMonthLabel}
      </Button>
    </div>
  );
}
