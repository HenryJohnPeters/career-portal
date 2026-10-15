import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { SubscriptionStatus } from "@careerportal/shared/types";
import {
  ACTIVATION_POLL_DELAYS_MS,
  describeSubscription,
  formatLongDate,
  isCheckoutSessionId,
  isSafeBillingRedirect,
  upgradeLabel,
} from "./billing-status";

const PERIOD_END = "2026-11-12T12:00:00.000Z";

function status(overrides: Partial<SubscriptionStatus> = {}): SubscriptionStatus {
  return {
    isPremium: false,
    status: "none",
    stripeSubscriptionId: null,
    stripePriceId: null,
    stripeCurrentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    trialEnd: null,
    paymentIssue: false,
    hasBillingAccount: false,
    trialEligible: false,
    trialDays: 0,
    ...overrides,
  };
}

const premium = (overrides: Partial<SubscriptionStatus> = {}) =>
  status({
    isPremium: true,
    status: "active",
    stripeCurrentPeriodEnd: PERIOD_END,
    hasBillingAccount: true,
    ...overrides,
  });

describe("describeSubscription", () => {
  test("free user: no chip", () => {
    assert.deepEqual(describeSubscription(status(), "UTC"), { plan: "Free", chip: null, detail: null });
  });

  test("active premium renews", () => {
    const summary = describeSubscription(premium(), "UTC");
    assert.equal(summary.plan, "Premium");
    assert.deepEqual(summary.chip, { label: "Active", tone: "success" });
    assert.match(summary.detail ?? "", /Renews on 12 November 2026/);
  });

  test("cancelled at period end never says 'Renews'", () => {
    const summary = describeSubscription(premium({ cancelAtPeriodEnd: true }), "UTC");
    assert.deepEqual(summary.chip, { label: "Ends 12 November 2026", tone: "warning" });
    assert.doesNotMatch(summary.detail ?? "", /Renews/);
    assert.match(summary.detail ?? "", /until 12 November 2026/);
  });

  test("trial shows its end date and the price that follows", () => {
    const summary = describeSubscription(
      premium({ status: "trialing", trialEnd: "2026-10-22T12:00:00.000Z" }),
      "UTC",
    );
    assert.equal(summary.chip?.label, "Free trial");
    assert.match(summary.detail ?? "", /ends on 22 October 2026, then it's £9\.99\/month/);

    const cancelled = describeSubscription(
      premium({ status: "trialing", trialEnd: "2026-10-22T12:00:00.000Z", cancelAtPeriodEnd: true }),
      "UTC",
    );
    assert.match(cancelled.detail ?? "", /won't be charged/);
  });

  test("payment problems take priority", () => {
    const pastDue = describeSubscription(status({ status: "past_due", paymentIssue: true, hasBillingAccount: true }), "UTC");
    assert.deepEqual(pastDue.chip, { label: "Payment issue", tone: "error" });
    assert.match(pastDue.detail ?? "", /payment failed/);
    const incomplete = describeSubscription(status({ status: "incomplete", paymentIssue: true }), "UTC");
    assert.match(incomplete.detail ?? "", /first payment needs attention/);
  });

  test("ended and paused subscriptions", () => {
    assert.equal(describeSubscription(status({ status: "canceled" }), "UTC").chip?.label, "Premium ended");
    assert.equal(describeSubscription(status({ status: "paused" }), "UTC").chip?.label, "Paused");
  });
});

describe("upgradeLabel", () => {
  test("trial copy only when eligible and enabled", () => {
    assert.equal(upgradeLabel(status({ trialEligible: true, trialDays: 7 })), "Start 7-day free trial");
    assert.match(upgradeLabel(status({ trialEligible: true, trialDays: 0 })), /^Upgrade to Premium/);
    assert.match(upgradeLabel(status({ trialEligible: false, trialDays: 7 })), /^Upgrade to Premium/);
    assert.match(upgradeLabel(undefined), /£9\.99\/mo/);
  });
});

describe("isCheckoutSessionId", () => {
  test("matches the API's validation", () => {
    assert.equal(isCheckoutSessionId("cs_test_a1B2c3"), true);
    for (const value of [null, undefined, "", "cs_", "pi_123", "cs_abc;drop", "cs_abc def", `cs_${"a".repeat(300)}`]) {
      assert.equal(isCheckoutSessionId(value), false, String(value));
    }
  });
});

describe("isSafeBillingRedirect", () => {
  test("https only", () => {
    assert.equal(isSafeBillingRedirect("https://checkout.stripe.com/c/pay/cs_test_123"), true);
    assert.equal(isSafeBillingRedirect("https://billing.stripe.com/p/session/abc"), true);
    for (const value of ["http://checkout.stripe.com", "javascript:alert(1)", "/app/billing", "", null, 42]) {
      assert.equal(isSafeBillingRedirect(value), false, String(value));
    }
  });
});

describe("formatLongDate", () => {
  test("formats and tolerates bad input", () => {
    assert.equal(formatLongDate(PERIOD_END, "UTC"), "12 November 2026");
    assert.equal(formatLongDate(null), null);
    assert.equal(formatLongDate("not a date"), null);
  });
});

test("activation polling stays within about 30 seconds", () => {
  const total = ACTIVATION_POLL_DELAYS_MS.reduce((sum, ms) => sum + ms, 0);
  assert.ok(total >= 20_000 && total <= 40_000, String(total));
});
