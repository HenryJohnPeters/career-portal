import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  canReusePendingCheckout,
  checkoutExpiresAt,
  checkoutIdempotencyKey,
  checkoutSessionOwnerId,
  customerIdempotencyKey,
  isCheckoutSessionOwnedBy,
  isCheckoutSessionTerminal,
} from "./checkout-session.util";

const USER = "8d2f7c1e-1111-4a5b-9c3d-000000000001";
const OTHER = "8d2f7c1e-2222-4a5b-9c3d-000000000002";

const openSession = {
  mode: "subscription",
  status: "open",
  url: "https://checkout.stripe.com/c/pay/cs_test_123",
  client_reference_id: USER,
  metadata: { userId: USER },
  customer: "cus_1",
};

describe("checkout session state", () => {
  test("terminal statuses are complete and expired only", () => {
    assert.equal(isCheckoutSessionTerminal("complete"), true);
    assert.equal(isCheckoutSessionTerminal("expired"), true);
    assert.equal(isCheckoutSessionTerminal("open"), false);
    assert.equal(isCheckoutSessionTerminal(null), false);
  });
});

describe("ownership", () => {
  test("requires the user in client_reference_id or metadata", () => {
    assert.equal(isCheckoutSessionOwnedBy({ client_reference_id: USER, metadata: null }, USER), true);
    assert.equal(isCheckoutSessionOwnedBy({ client_reference_id: null, metadata: { userId: USER } }, USER), true);
    assert.equal(isCheckoutSessionOwnedBy({ client_reference_id: null, metadata: null }, USER), false);
    assert.equal(isCheckoutSessionOwnedBy({ client_reference_id: null, metadata: {} }, USER), false);
    assert.equal(isCheckoutSessionOwnedBy({ client_reference_id: OTHER, metadata: { userId: OTHER } }, USER), false);
  });

  test("owner id comes from client_reference_id, then metadata", () => {
    assert.equal(checkoutSessionOwnerId({ client_reference_id: USER, metadata: { userId: OTHER } }), USER);
    assert.equal(checkoutSessionOwnerId({ client_reference_id: null, metadata: { userId: OTHER } }), OTHER);
    assert.equal(checkoutSessionOwnerId({ client_reference_id: "", metadata: null }), null);
  });
});

describe("canReusePendingCheckout", () => {
  const expected = { userId: USER, customerId: "cus_1" };

  test("reuses an open, payable session of the same user and customer", () => {
    assert.equal(canReusePendingCheckout(openSession, expected), true);
    assert.equal(canReusePendingCheckout({ ...openSession, customer: { id: "cus_1" } }, expected), true);
  });

  test("rejects anything else", () => {
    const cases = {
      payment: { ...openSession, mode: "payment" },
      complete: { ...openSession, status: "complete" },
      expired: { ...openSession, status: "expired" },
      noUrl: { ...openSession, url: null },
      otherCustomer: { ...openSession, customer: "cus_2" },
      noCustomer: { ...openSession, customer: null },
      otherUser: { ...openSession, client_reference_id: OTHER, metadata: { userId: OTHER } },
      unowned: { ...openSession, client_reference_id: null, metadata: null },
    };
    for (const [name, session] of Object.entries(cases)) {
      assert.equal(canReusePendingCheckout(session, expected), false, name);
    }
  });
});

describe("checkout expiry and idempotency", () => {
  const now = Date.UTC(2026, 9, 15, 12, 2, 30);

  test("expires 31-36 minutes ahead, within Stripe's 30min-24h range", () => {
    for (const offset of [0, 1, 60_000, 299_999]) {
      const aheadS = checkoutExpiresAt(now + offset) - (now + offset) / 1000;
      assert.ok(aheadS > 31 * 60 && aheadS <= 36 * 60, `offset ${offset}: ${aheadS}s`);
    }
  });

  test("concurrent requests in one window get identical params and key", () => {
    const params = { userId: USER, customerId: "cus_1", priceId: "price_1", trialDays: 0 };
    const windowStart = Math.floor(now / 300_000) * 300_000;
    const later = windowStart + 299_000;
    assert.equal(checkoutExpiresAt(windowStart), checkoutExpiresAt(later));
    assert.equal(
      checkoutIdempotencyKey({ ...params, nowMs: windowStart }),
      checkoutIdempotencyKey({ ...params, nowMs: later }),
    );
  });

  test("key changes with the window, customer, price or trial", () => {
    const params = { userId: USER, customerId: "cus_1", priceId: "price_1", trialDays: 0, nowMs: now };
    const key = checkoutIdempotencyKey(params);
    assert.notEqual(checkoutIdempotencyKey({ ...params, nowMs: now + 300_000 }), key);
    assert.notEqual(checkoutIdempotencyKey({ ...params, customerId: "cus_2" }), key);
    assert.notEqual(checkoutIdempotencyKey({ ...params, priceId: "price_2" }), key);
    assert.notEqual(checkoutIdempotencyKey({ ...params, trialDays: 7 }), key);
    assert.ok(key.length <= 255);
  });

  test("customer key: shared by requests on the same row, new after the row changes", () => {
    const user = { id: USER, stripeCustomerId: null, updatedAt: new Date(now) };
    const key = customerIdempotencyKey(user);
    assert.equal(customerIdempotencyKey({ ...user }), key);
    // A detached (deleted) customer leaves stripeCustomerId null again, but
    // the write moves updatedAt, so Stripe cannot replay the deleted customer.
    assert.notEqual(customerIdempotencyKey({ ...user, updatedAt: new Date(now + 1) }), key);
    assert.notEqual(customerIdempotencyKey({ ...user, stripeCustomerId: "cus_gone" }), key);
    assert.ok(key.length <= 255);
  });
});
