/* Pure Checkout Session helpers; see the spec. */

/** Stripe accepts `expires_at` 30 minutes to 24 hours ahead. */
const CHECKOUT_TTL_S = 31 * 60;
/** Requests in the same window share an idempotency key and session params. */
const CHECKOUT_BUCKET_S = 5 * 60;

interface CheckoutSessionLike {
  mode: string;
  status: string | null;
  url: string | null;
  client_reference_id: string | null;
  metadata: Record<string, string> | null;
  customer: string | { id: string } | null;
}

export function isCheckoutSessionTerminal(status: string | null): boolean {
  return status === "complete" || status === "expired";
}

/** Positive ownership: every session this API creates names the user. */
export function isCheckoutSessionOwnedBy(
  session: Pick<CheckoutSessionLike, "client_reference_id" | "metadata">,
  userId: string,
): boolean {
  return (
    session.client_reference_id === userId || session.metadata?.userId === userId
  );
}

/** The user a session was created for, if it names one. */
export function checkoutSessionOwnerId(
  session: Pick<CheckoutSessionLike, "client_reference_id" | "metadata">,
): string | null {
  return session.client_reference_id || session.metadata?.userId || null;
}

/** A stored pending session can be handed out again only if it is still payable by this user and customer. */
export function canReusePendingCheckout(
  session: CheckoutSessionLike,
  expected: { userId: string; customerId: string },
): boolean {
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null);
  return (
    session.mode === "subscription" &&
    session.status === "open" &&
    !!session.url &&
    customerId === expected.customerId &&
    isCheckoutSessionOwnedBy(session, expected.userId)
  );
}

/**
 * Deterministic per 5-minute window, so concurrent requests (double click, two
 * tabs) send identical params under one idempotency key and get one session.
 * Always 31-36 minutes ahead; the DB lock uses the same value.
 */
export function checkoutExpiresAt(nowMs: number): number {
  const bucketEnd =
    (Math.floor(nowMs / 1000 / CHECKOUT_BUCKET_S) + 1) * CHECKOUT_BUCKET_S;
  return bucketEnd + CHECKOUT_TTL_S;
}

/**
 * Requests that see the same stored user (double click, two tabs) share a key
 * and get one customer. Any later write to the user, such as detaching a
 * customer deleted in Stripe, changes `updatedAt` and so the key: Stripe keeps
 * keys for 24h and would otherwise replay the deleted customer.
 */
export function customerIdempotencyKey(user: {
  id: string;
  stripeCustomerId: string | null;
  updatedAt: Date;
}): string {
  return [
    "customer",
    user.id,
    user.stripeCustomerId ?? "new",
    user.updatedAt.getTime(),
  ].join(":");
}

export function checkoutIdempotencyKey(params: {
  userId: string;
  customerId: string;
  priceId: string;
  trialDays: number;
  nowMs: number;
}): string {
  const bucket = Math.floor(params.nowMs / 1000 / CHECKOUT_BUCKET_S);
  return [
    "checkout",
    params.userId,
    params.customerId,
    params.priceId,
    params.trialDays,
    bucket,
  ].join(":");
}
