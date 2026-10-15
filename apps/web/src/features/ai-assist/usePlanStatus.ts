import { useCallback } from "react";
import {
  FREE_TIER,
  isActivePremium,
  isMeterExhausted,
  type UsageMeter,
} from "@careerportal/shared/types";
import { requestUpgrade, usePlanUsage } from "@careerportal/web/data-access";
import { useAuth } from "../../lib/auth";

/** Count-limited resources the free plan caps (not monthly). */
export type CountQuota = "cvVersions" | "coverLetters";

const FREE_COUNT_LIMITS: Record<CountQuota, number> = {
  cvVersions: FREE_TIER.cvVersions,
  coverLetters: FREE_TIER.coverLetters,
};

/**
 * The user's plan as the server sees it (GET /account/usage), with the account
 * flag as a fallback while it loads. Used for every client-side gate in the
 * CV and cover-letter features; the API enforces the same limits.
 */
export function usePlanStatus() {
  const { user } = useAuth();
  const { data } = usePlanUsage();
  const usage = data?.data ?? null;
  const isPremium = usage?.isPremium ?? isActivePremium(user);
  const aiMeter: UsageMeter | null = usage?.meters.aiActions ?? null;

  const limitFor = useCallback(
    (key: CountQuota): number | null => {
      if (isPremium) return null;
      const meter = usage?.meters[key];
      return meter ? meter.limit : FREE_COUNT_LIMITS[key];
    },
    [isPremium, usage],
  );

  /** True when creating one more `key` would exceed the plan. */
  const isAtLimit = useCallback(
    (key: CountQuota, count: number) => {
      const limit = limitFor(key);
      return limit !== null && count >= limit;
    },
    [limitFor],
  );

  /** Open the global upgrade prompt for a count limit. */
  const promptUpgrade = useCallback(
    (key: CountQuota, count: number) => {
      requestUpgrade({
        reason: "quota_exceeded",
        quota: key,
        limit: limitFor(key) ?? undefined,
        used: count,
        resetsAt: null,
      });
    },
    [limitFor],
  );

  return {
    isPremium,
    usage,
    /** Premium users get every template and interviewer. */
    allTemplates: usage?.features.allTemplates ?? isPremium,
    aiMeter,
    /** Free users with AI actions left, or Premium (fair use is enforced by the API). */
    hasAiUsesLeft: isPremium || !isMeterExhausted(aiMeter),
    limitFor,
    isAtLimit,
    promptUpgrade,
  };
}
