import { NavLink } from "react-router-dom";
import { Crown, Sparkles } from "lucide-react";
import { PREMIUM_PRICE } from "@careerportal/shared/types";
import { usePlanUsage } from "@careerportal/web/data-access";
import { UsageMeterBar } from "../components/PlanUsageCard";
import { buildMeterRow, formatResetDate } from "../lib/plan-usage";

/** Free-plan upsell at the bottom of the sidebar, with this month's AI usage. */
export function SidebarUpgradeBox({ onNavigate }: { onNavigate?: () => void }) {
  const { data } = usePlanUsage();
  const aiMeter = data?.data?.meters?.aiActions;
  const aiRow = aiMeter && aiMeter.limit !== null ? buildMeterRow("aiActions", aiMeter) : null;
  const resetLabel = formatResetDate(aiMeter?.resetsAt);

  return (
    <div className="px-3 pb-4 shrink-0">
      <div className="rounded-xl bg-gradient-to-r from-accent-500/10 to-accent-400/5 border border-accent-400/30 p-3.5">
        <NavLink
          to="/app/billing"
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-500 shadow-sm">
            <Crown className="h-4 w-4 text-white" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-accent-800 dark:text-accent-300 group-hover:underline">
              Upgrade to Premium
            </span>
            <span className="block text-[11px] leading-snug text-accent-800/90 dark:text-accent-200/80">
              Unlimited AI (fair use) · {PREMIUM_PRICE.perMonthLabel}
            </span>
          </span>
          <Sparkles className="h-3.5 w-3.5 text-accent-600 dark:text-accent-400 shrink-0 ml-auto" aria-hidden="true" />
        </NavLink>
        {aiRow && (
          <div className="mt-3 border-t border-accent-400/20 pt-2.5">
            <UsageMeterBar
              size="sm"
              label="AI actions this month"
              used={aiRow.used}
              limit={aiRow.limit}
              percent={aiRow.percent}
              tone={aiRow.tone}
            />
            {resetLabel && aiRow.tone !== "ok" && (
              <p className="mt-1 text-[10px] text-text-tertiary">Resets {resetLabel}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
