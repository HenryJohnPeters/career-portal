/**
 * Premium stays on this long past `stripeCurrentPeriodEnd` while the renewal
 * is confirmed, so a delayed renewal webhook does not lock out a paying user.
 * A subscription set to cancel gets no grace.
 */
export const PREMIUM_RENEWAL_GRACE_MS = 12 * 60 * 60 * 1000;

/**
 * Whether a user has active premium. Requires the `isPremium` flag (kept in
 * sync with Stripe by the billing module) AND a current period end that has
 * not lapsed (plus the renewal grace), so a missed downgrade webhook still
 * expires premium on its own.
 */
export function isActivePremium(
  user: {
    isPremium: boolean;
    stripeCurrentPeriodEnd: Date | null;
    cancelAtPeriodEnd?: boolean;
  },
  now: Date = new Date(),
): boolean {
  if (!user.isPremium || !user.stripeCurrentPeriodEnd) return false;
  const grace = user.cancelAtPeriodEnd ? 0 : PREMIUM_RENEWAL_GRACE_MS;
  return now.getTime() < user.stripeCurrentPeriodEnd.getTime() + grace;
}
