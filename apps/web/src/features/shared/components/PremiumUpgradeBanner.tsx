import { useNavigate } from "react-router-dom";
import { Crown, Sparkles, Zap, ArrowRight } from "lucide-react";
import { Badge } from "@careerportal/web/ui";

interface PremiumUpgradeBannerProps {
  /** Optional extra context shown below the main subtitle */
  message?: string;
}

export function PremiumUpgradeBanner({ message }: PremiumUpgradeBannerProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/app/billing")}
      className="w-full rounded-2xl border border-accent-400/30 bg-accent-50 dark:bg-accent-900/20 p-5 text-left group hover:border-accent-400/50 dark:hover:border-accent-600/40 hover:bg-accent-100/60 dark:hover:bg-accent-900/30 hover:shadow-sm transition-all duration-200 active:scale-[0.995]"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-accent-400 shadow-sm shrink-0">
          <Crown className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-accent-700 dark:text-accent-300">
              Unlock Premium AI Features
            </p>
            <Badge variant="warning">£9.99/mo</Badge>
          </div>
          <p className="text-xs text-accent-800 dark:text-accent-200 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-accent-500 shrink-0" />
            {message ||
              "AI-powered CV rewriting, cover letters, interview prep & more"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-600 dark:text-accent-400 group-hover:gap-2.5 transition-all shrink-0">
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Upgrade</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </button>
  );
}
