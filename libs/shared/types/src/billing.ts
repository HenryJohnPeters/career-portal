// === Billing (PLAN §2.4) ===

/** Mirror of the Stripe subscription status; "none" = never subscribed. */
export type SubscriptionState =
  | "none"
  | "active"
  | "trialing"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

/** GET /billing/status */
export interface SubscriptionStatus {
  isPremium: boolean;
  status: SubscriptionState;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: string | null;
  /** Cancelled but still active until `stripeCurrentPeriodEnd` ("Ends {date}", not "Renews"). */
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  /** past_due | unpaid | incomplete — show "Fix payment" (opens the billing portal). */
  paymentIssue: boolean;
  /** A Stripe customer exists → show "Manage billing". */
  hasBillingAccount: boolean;
  trialEligible: boolean;
  /** 0 = trials disabled. Show "Start N-day free trial" when trialEligible && trialDays > 0. */
  trialDays: number;
}

/** POST /billing/checkout and POST /billing/portal */
export interface BillingRedirect {
  url: string;
}
