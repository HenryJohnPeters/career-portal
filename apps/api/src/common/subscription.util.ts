/**
 * Checks whether a user has an active (non-expired) premium subscription.
 *
 * Premium requires BOTH conditions to hold:
 * 1. isPremium flag is true (set by Stripe webhook on subscription.updated)
 * 2. stripeCurrentPeriodEnd is in the future (subscription has not lapsed)
 *
 * The second check is a safety net: even if the webhook to downgrade
 * isPremium is missed, the period-end date will eventually expire and
 * correctly deny premium access.
 */
export function isActivePremium(user: {
  isPremium: boolean;
  stripeCurrentPeriodEnd: Date | null;
}): boolean {
  if (!user.isPremium) return false;
  if (!user.stripeCurrentPeriodEnd) return false;
  return new Date() < user.stripeCurrentPeriodEnd;
}
