import { Link } from "react-router-dom";
import { ArrowRight, Crown, Sparkles } from "lucide-react";
import { PREMIUM_PRICE } from "@careerportal/shared/types";
import { useSubscriptionStatus } from "@careerportal/web/data-access";
import { Badge } from "@careerportal/web/ui";

interface PremiumUpgradeBannerProps {
  /** Context-specific line shown under the heading (e.g. why the user hit a limit). */
  message?: string;
}

/** Link to the billing page; shows the free-trial offer when the user is eligible. */
export function PremiumUpgradeBanner({ message }: PremiumUpgradeBannerProps) {
  const status = useSubscriptionStatus().data?.data;
  const trialDays = status?.trialEligible ? status.trialDays : 0;

  return (
    <Link
      to="/app/billing"
      className="block w-full rounded-2xl border border-accent-400/30 bg-accent-50 dark:bg-accent-900/20 p-5 text-left group hover:border-accent-400/50 dark:hover:border-accent-600/40 hover:bg-accent-100/60 dark:hover:bg-accent-900/30 hover:shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-accent-500 shadow-sm shrink-0"
        >
          <Crown className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-accent-800 dark:text-accent-200">
              {trialDays > 0 ? `Try Premium free for ${trialDays} days` : "Upgrade to Premium"}
            </p>
            <Badge variant="warning">{trialDays > 0 ? `then ${PREMIUM_PRICE.perMonthLabel}` : PREMIUM_PRICE.perMonthLabel}</Badge>
          </div>
          <p className="text-xs text-accent-900 dark:text-accent-100 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-accent-600 dark:text-accent-300 shrink-0" aria-hidden="true" />
            {message ||
              "Unlimited CVs and cover letters, the Tailor-for-this-job kit, full insights and a better AI model."}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-accent-700 dark:text-accent-300 group-hover:gap-2.5 transition-all shrink-0">
          <span className="hidden sm:inline">{trialDays > 0 ? "Start trial" : "Upgrade"}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
