import Stripe from "stripe";

export function isEntitledSubscriptionStatus(
  status: Stripe.Subscription.Status,
): boolean {
  return status === "active" || status === "trialing";
}

export function isPremiumEntitled(params: {
  status: Stripe.Subscription.Status;
  priceId: string | null;
  expectedPriceId: string;
}): boolean {
  if (!isEntitledSubscriptionStatus(params.status)) return false;
  return !!params.priceId && params.priceId === params.expectedPriceId;
}

export function pickMostRelevantSubscription<T extends {
  created: number;
  status: Stripe.Subscription.Status;
}>(subscriptions: T[]): T | null {
  if (subscriptions.length === 0) return null;

  const sorted = [...subscriptions].sort((a, b) => b.created - a.created);
  const entitled = sorted.find((s) => isEntitledSubscriptionStatus(s.status));
  return entitled ?? sorted[0];
}
