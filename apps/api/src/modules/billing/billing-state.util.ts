import { isActivePremium } from "../../common/subscription.util";

/* Pure subscription-state logic (no Stripe or DB access); see the spec. */

const SUBSCRIPTION_STATES = [
  "none",
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "paused",
] as const;

/** Mirror of the Stripe subscription status; "none" = never subscribed. */
export type SubscriptionState = (typeof SUBSCRIPTION_STATES)[number];

/** GET /billing/status (mirrors `SubscriptionStatus` in libs/shared/types/src/billing.ts). */
export interface SubscriptionStatus {
  isPremium: boolean;
  status: SubscriptionState;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  paymentIssue: boolean;
  hasBillingAccount: boolean;
  trialEligible: boolean;
  trialDays: number;
}

/** The subscription fields these helpers read (a `Stripe.Subscription` satisfies it). */
export interface SubscriptionLike {
  id: string;
  created: number;
  status: string;
  cancel_at: number | null;
  cancel_at_period_end: boolean;
  trial_start: number | null;
  trial_end: number | null;
  items: { data: { price: { id: string }; current_period_end?: number }[] };
}

/** The User columns the billing module derives from Stripe. */
export interface SubscriptionSnapshot {
  isPremium: boolean;
  subscriptionStatus: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
}

export interface BillingUserFields extends SubscriptionSnapshot {
  stripeCustomerId: string | null;
  trialUsedAt: Date | null;
}

const ENTITLED = new Set(["active", "trialing"]);
const PAYMENT_ISSUE = new Set(["past_due", "unpaid", "incomplete"]);
const TERMINAL = new Set(["canceled", "incomplete_expired"]);

export const EMPTY_SNAPSHOT: SubscriptionSnapshot = {
  isPremium: false,
  subscriptionStatus: null,
  stripeSubscriptionId: null,
  stripePriceId: null,
  stripeCurrentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  trialEnd: null,
};

export function isEntitledSubscriptionStatus(status: string): boolean {
  return ENTITLED.has(status);
}

/** past_due | unpaid | incomplete: the customer must fix payment, not buy again. */
export function hasPaymentIssue(status: string | null): boolean {
  return status !== null && PAYMENT_ISSUE.has(status);
}

/** Not yet ended: can still bill or be resumed. */
export function isLiveSubscriptionStatus(status: string): boolean {
  return !TERMINAL.has(status);
}

/** The premium price on the subscription if it has one, else its first price. */
function subscriptionPriceId(
  sub: SubscriptionLike,
  premiumPriceIds: ReadonlySet<string>,
): string | null {
  const items = sub.items.data;
  const premium = items.find((item) => premiumPriceIds.has(item.price.id));
  return (premium ?? items[0])?.price.id ?? null;
}

function relevance(
  sub: SubscriptionLike,
  premiumPriceIds: ReadonlySet<string>,
): number {
  if (isEntitledSubscriptionStatus(sub.status)) {
    const priceId = subscriptionPriceId(sub, premiumPriceIds);
    return priceId && premiumPriceIds.has(priceId) ? 3 : 1;
  }
  return isLiveSubscriptionStatus(sub.status) ? 2 : 0;
}

/**
 * The subscription that decides a customer's state: an entitled premium one,
 * then one awaiting payment, then an entitled one on an unknown price, then an
 * ended one; newest first within a rank. A stale or secondary subscription
 * therefore never hides the one the customer is paying for.
 */
export function pickMostRelevantSubscription<T extends SubscriptionLike>(
  subscriptions: readonly T[],
  premiumPriceIds: ReadonlySet<string>,
): T | null {
  let best: T | null = null;
  let bestRank = -1;
  for (const sub of subscriptions) {
    const rank = relevance(sub, premiumPriceIds);
    if (rank > bestRank || (rank === bestRank && sub.created > best!.created)) {
      best = sub;
      bestRank = rank;
    }
  }
  return best;
}

const fromUnix = (seconds: number | null | undefined): Date | null =>
  seconds ? new Date(seconds * 1000) : null;

export function toSubscriptionSnapshot(
  sub: SubscriptionLike | null,
  premiumPriceIds: ReadonlySet<string>,
): SubscriptionSnapshot {
  if (!sub) return EMPTY_SNAPSHOT;

  const priceId = subscriptionPriceId(sub, premiumPriceIds);
  const item =
    sub.items.data.find((i) => i.price.id === priceId) ?? sub.items.data[0];
  const periodEnd = item?.current_period_end ?? null;
  // A cancellation scheduled within this period ends premium at that time;
  // one scheduled further out still renews first.
  const cancelsThisPeriod =
    sub.cancel_at !== null && (periodEnd === null || sub.cancel_at <= periodEnd);

  return {
    isPremium:
      isEntitledSubscriptionStatus(sub.status) &&
      priceId !== null &&
      premiumPriceIds.has(priceId),
    subscriptionStatus: sub.status,
    stripeSubscriptionId: sub.id,
    stripePriceId: priceId,
    stripeCurrentPeriodEnd: fromUnix(cancelsThisPeriod ? sub.cancel_at : periodEnd),
    cancelAtPeriodEnd:
      isLiveSubscriptionStatus(sub.status) &&
      (sub.cancel_at_period_end || cancelsThisPeriod),
    trialEnd: sub.status === "trialing" ? fromUnix(sub.trial_end) : null,
  };
}

/** True when writing `snapshot` would change any stored column. */
export function snapshotDiffers(
  user: SubscriptionSnapshot,
  snapshot: SubscriptionSnapshot,
): boolean {
  return (Object.keys(snapshot) as (keyof SubscriptionSnapshot)[]).some(
    (key) => {
      const a = user[key];
      const b = snapshot[key];
      return a instanceof Date || b instanceof Date
        ? (a as Date | null)?.getTime() !== (b as Date | null)?.getTime()
        : a !== b;
    },
  );
}

/** When the customer first started a trial (a user may trial only once). */
export function earliestTrialStart(
  subscriptions: readonly SubscriptionLike[],
): Date | null {
  const starts = subscriptions
    .map((s) => s.trial_start)
    .filter((t): t is number => typeof t === "number" && t > 0);
  return starts.length ? fromUnix(Math.min(...starts)) : null;
}

/** Audit action for a premium transition, or null when nothing changed. */
export function premiumTransition(
  wasPremium: boolean,
  isPremium: boolean,
): "premium.upgraded" | "premium.downgraded" | null {
  if (wasPremium === isPremium) return null;
  return isPremium ? "premium.upgraded" : "premium.downgraded";
}

/**
 * Trials (PLAN §1.4): enabled, never trialed, and no subscription history.
 * After a sync, a null status and subscription id mean the customer has none.
 */
export function isTrialEligible(
  user: Pick<
    BillingUserFields,
    "trialUsedAt" | "subscriptionStatus" | "stripeSubscriptionId"
  >,
  trialDays: number,
): boolean {
  return (
    trialDays > 0 &&
    user.trialUsedAt === null &&
    user.subscriptionStatus === null &&
    user.stripeSubscriptionId === null
  );
}

function toState(user: BillingUserFields, isPremium: boolean): SubscriptionState {
  const known = SUBSCRIPTION_STATES.find((s) => s === user.subscriptionStatus);
  if (known && known !== "none") return known;
  // Rows written before the status was stored.
  return isPremium ? "active" : "none";
}

export function toSubscriptionStatus(
  user: BillingUserFields,
  trialDays: number,
  now: Date = new Date(),
): SubscriptionStatus {
  const isPremium = isActivePremium(user, now);
  const status = toState(user, isPremium);
  return {
    isPremium,
    status,
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripePriceId: user.stripePriceId,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    trialEnd: user.trialEnd?.toISOString() ?? null,
    paymentIssue: hasPaymentIssue(status),
    hasBillingAccount: user.stripeCustomerId !== null,
    trialEligible: isTrialEligible(user, trialDays),
    trialDays,
  };
}

/* ── Webhook redelivery ── */

/**
 * A claimed but unfinished event is presumed abandoned (crash, redeploy) after
 * this long. Comfortably above a handler's worst case (a few Stripe calls at
 * 10s timeout with 2 retries).
 */
export const WEBHOOK_EVENT_STALE_MS = 5 * 60 * 1000;

/**
 * What to do with a delivery whose event id is already recorded:
 * "skip" once processed (acknowledge), "in_progress" while another attempt is
 * running (reply non-2xx so Stripe retries later), "reclaim" when that attempt
 * looks abandoned (process it again; handlers are idempotent).
 */
export function classifyRedelivery(
  existing: { processedAt: Date | null; createdAt: Date },
  nowMs: number,
  staleMs: number = WEBHOOK_EVENT_STALE_MS,
): "skip" | "in_progress" | "reclaim" {
  if (existing.processedAt) return "skip";
  return nowMs - existing.createdAt.getTime() > staleMs
    ? "reclaim"
    : "in_progress";
}
