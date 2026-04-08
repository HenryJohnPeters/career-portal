import Stripe from "stripe";

type CheckoutStatus = Stripe.Checkout.Session.Status;

export function isCheckoutSessionTerminal(
  status: CheckoutStatus | null,
): boolean {
  return status === "complete" || status === "expired";
}

export function getCheckoutSessionSubscriptionId(
  session: Stripe.Checkout.Session,
): string | null {
  const sub = session.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

export function shouldReusePendingCheckoutSession(params: {
  mode: Stripe.Checkout.Session.Mode;
  status: CheckoutStatus | null;
  url: string | null;
  expiresAtMs: number | null;
  nowMs: number;
}): boolean {
  if (params.mode !== "subscription") return false;
  if (params.status !== "open") return false;
  if (!params.url) return false;
  if (params.expiresAtMs === null) return true;
  return params.expiresAtMs > params.nowMs;
}
