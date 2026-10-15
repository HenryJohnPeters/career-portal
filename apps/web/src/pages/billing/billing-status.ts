import { PREMIUM_PRICE, type SubscriptionStatus } from "@careerportal/shared/types";

export type StatusTone = "primary" | "success" | "warning" | "error" | "neutral";

export interface SubscriptionSummary {
  plan: "Free" | "Premium";
  /** Short status chip, e.g. "Active", "Cancels 12 Nov 2026". */
  chip: { label: string; tone: StatusTone } | null;
  /** One line under the plan name. */
  detail: string | null;
}

/** "12 November 2026" (device time zone unless one is given, e.g. "UTC" in tests). */
export function formatLongDate(iso: string | null | undefined, timeZone?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone });
}

/** The plan card's headline, chip and detail line for a subscription status. */
export function describeSubscription(status: SubscriptionStatus, timeZone?: string): SubscriptionSummary {
  const periodEnd = formatLongDate(status.stripeCurrentPeriodEnd, timeZone);
  const trialEnd = formatLongDate(status.trialEnd ?? status.stripeCurrentPeriodEnd, timeZone);
  const price = `${PREMIUM_PRICE.label}/month`;

  if (status.paymentIssue) {
    const detail =
      status.status === "incomplete"
        ? "Your first payment needs attention (for example, bank authentication). Complete it to start Premium."
        : "Your last payment failed. Update your payment method to keep Premium.";
    return { plan: status.isPremium ? "Premium" : "Free", chip: { label: "Payment issue", tone: "error" }, detail };
  }

  if (status.status === "trialing") {
    if (status.cancelAtPeriodEnd) {
      return {
        plan: "Premium",
        chip: { label: "Trial · cancelled", tone: "warning" },
        detail: trialEnd ? `Your trial ends on ${trialEnd}. You won't be charged.` : "Your trial is cancelled. You won't be charged.",
      };
    }
    return {
      plan: "Premium",
      chip: { label: "Free trial", tone: "primary" },
      detail: trialEnd
        ? `Your trial ends on ${trialEnd}, then it's ${price} unless you cancel before then.`
        : `Then ${price} unless you cancel before the trial ends.`,
    };
  }

  if (status.isPremium) {
    if (status.cancelAtPeriodEnd) {
      return {
        plan: "Premium",
        chip: { label: periodEnd ? `Ends ${periodEnd}` : "Cancelled", tone: "warning" },
        detail: periodEnd
          ? `Premium stays active until ${periodEnd}. You won't be charged again.`
          : "Premium stays active until the end of your billing period. You won't be charged again.",
      };
    }
    return {
      plan: "Premium",
      chip: { label: "Active", tone: "success" },
      detail: periodEnd ? `Renews on ${periodEnd} at ${price}.` : `Renews monthly at ${price}.`,
    };
  }

  if (status.status === "paused") {
    return {
      plan: "Free",
      chip: { label: "Paused", tone: "warning" },
      detail: "Your Premium subscription is paused. Resume it from Manage billing.",
    };
  }
  if (status.status === "canceled") {
    return {
      plan: "Free",
      chip: { label: "Premium ended", tone: "neutral" },
      detail: "Your Premium subscription has ended. Everything you created is still here.",
    };
  }
  return { plan: "Free", chip: null, detail: null };
}

/** Label for the main upgrade button. */
export function upgradeLabel(status: Pick<SubscriptionStatus, "trialEligible" | "trialDays"> | null | undefined): string {
  if (status?.trialEligible && status.trialDays > 0) return `Start ${status.trialDays}-day free trial`;
  return `Upgrade to Premium · ${PREMIUM_PRICE.perMonthLabel}`;
}

/** Stripe Checkout session ids, as accepted by POST /billing/checkout/verify. */
export function isCheckoutSessionId(value: string | null | undefined): value is string {
  return typeof value === "string" && value.length <= 255 && /^cs_[A-Za-z0-9_]+$/.test(value);
}

/** Only https URLs (Stripe Checkout / billing portal) are followed. */
export function isSafeBillingRedirect(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

/** Waits between subscription-status checks after returning from Checkout (about 30s in total). */
export const ACTIVATION_POLL_DELAYS_MS: readonly number[] = [1500, 2500, 4000, 6000, 8000, 10000];
