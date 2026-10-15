import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown } from "lucide-react";
import { PREMIUM_PRICE } from "@careerportal/shared/types";
import {
  dismissUpgrade,
  useSubscriptionStatus,
  useUpgradePrompt,
} from "@careerportal/web/data-access";
import { Button, Dialog } from "@careerportal/web/ui";
import { useAuth } from "../lib/auth";
import { formatResetDate } from "../lib/plan-usage";
import { getUpgradeCopy } from "../lib/upgrade-copy";

/**
 * The single global upgrade prompt. Opened through requestUpgrade() — by the
 * React Query error handlers for quota/premium API errors, or by locked
 * premium buttons — and rendered once at the app root.
 */
export function UpgradeDialog() {
  const prompt = useUpgradePrompt();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const upgradeRef = useRef<HTMLButtonElement>(null);
  // Only needed for the trial copy, and only while the dialog is open.
  const subscription = useSubscriptionStatus(prompt !== null && isAuthenticated);

  if (!prompt) return null;

  const copy = getUpgradeCopy(prompt);
  const resetLabel = prompt.reason === "quota_exceeded" ? formatResetDate(prompt.resetsAt) : null;
  const status = subscription.data?.data;
  const trialDays = status?.trialEligible ? status.trialDays : 0;
  const ctaLabel =
    trialDays > 0 ? `Start ${trialDays}-day free trial` : `Upgrade — ${PREMIUM_PRICE.perMonthLabel}`;

  const goToBilling = () => {
    dismissUpgrade();
    navigate("/app/billing");
  };

  return (
    <Dialog
      key={prompt.id}
      open
      onClose={dismissUpgrade}
      title={copy.title}
      description={copy.description}
      initialFocusRef={upgradeRef}
      icon={
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400"
        >
          <Crown className="h-5 w-5" />
        </div>
      }
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={dismissUpgrade}>
            Not now
          </Button>
          <Button ref={upgradeRef} size="sm" onClick={goToBilling}>
            {ctaLabel}
          </Button>
        </>
      }
    >
      <div className="rounded-xl border border-border bg-bg-tertiary/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
          Premium includes
        </p>
        <ul className="mt-2.5 space-y-2">
          {copy.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-sm text-text-primary">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
      {resetLabel && (
        <p className="mt-3 text-xs text-text-tertiary">
          Prefer to wait? Your free allowance resets on {resetLabel}.
        </p>
      )}
      {trialDays > 0 && (
        <p className="mt-3 text-xs text-text-tertiary">
          Free for {trialDays} days, then {PREMIUM_PRICE.perMonthLabel}. Cancel any time.
        </p>
      )}
    </Dialog>
  );
}
