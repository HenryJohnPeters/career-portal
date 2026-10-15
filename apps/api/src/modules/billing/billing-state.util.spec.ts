import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  PREMIUM_RENEWAL_GRACE_MS,
  isActivePremium,
} from "../../common/subscription.util";
import {
  EMPTY_SNAPSHOT,
  WEBHOOK_EVENT_STALE_MS,
  classifyRedelivery,
  earliestTrialStart,
  hasPaymentIssue,
  isEntitledSubscriptionStatus,
  isTrialEligible,
  pickMostRelevantSubscription,
  premiumTransition,
  snapshotDiffers,
  toSubscriptionSnapshot,
  toSubscriptionStatus,
  type BillingUserFields,
  type SubscriptionLike,
} from "./billing-state.util";

const PREMIUM = new Set(["price_premium", "price_premium_annual"]);
const PERIOD_END = 1_900_000_000; // 2030-03-17

function sub(overrides: Partial<SubscriptionLike> & { price?: string } = {}): SubscriptionLike {
  const { price = "price_premium", ...rest } = overrides;
  return {
    id: "sub_1",
    created: 100,
    status: "active",
    cancel_at: null,
    cancel_at_period_end: false,
    trial_start: null,
    trial_end: null,
    items: { data: [{ price: { id: price }, current_period_end: PERIOD_END }] },
    ...rest,
  };
}

function billingUser(overrides: Partial<BillingUserFields> = {}): BillingUserFields {
  return {
    ...EMPTY_SNAPSHOT,
    stripeCustomerId: null,
    trialUsedAt: null,
    ...overrides,
  };
}

describe("subscription statuses", () => {
  test("only active and trialing are entitled", () => {
    for (const s of ["active", "trialing"]) {
      assert.equal(isEntitledSubscriptionStatus(s), true, s);
    }
    for (const s of ["past_due", "canceled", "incomplete", "unpaid", "paused"]) {
      assert.equal(isEntitledSubscriptionStatus(s), false, s);
    }
  });

  test("payment issue means past_due, unpaid or incomplete", () => {
    for (const s of ["past_due", "unpaid", "incomplete"]) {
      assert.equal(hasPaymentIssue(s), true, s);
    }
    for (const s of ["active", "trialing", "canceled", "incomplete_expired", "paused", null]) {
      assert.equal(hasPaymentIssue(s), false, String(s));
    }
  });
});

describe("pickMostRelevantSubscription", () => {
  test("customer [past_due A, active B]: an event for A keeps the user premium on B", () => {
    const a = sub({ id: "sub_A", status: "past_due", created: 200 });
    const b = sub({ id: "sub_B", status: "active", created: 100 });
    const picked = pickMostRelevantSubscription([a, b], PREMIUM);
    assert.equal(picked?.id, "sub_B");

    const snapshot = toSubscriptionSnapshot(picked, PREMIUM);
    assert.equal(snapshot.isPremium, true);
    assert.equal(snapshot.stripeSubscriptionId, "sub_B");
    assert.equal(snapshot.subscriptionStatus, "active");
  });

  test("prefers an entitled subscription over a newer ended one", () => {
    const picked = pickMostRelevantSubscription(
      [sub({ id: "old", created: 100 }), sub({ id: "new", status: "canceled", created: 200 })],
      PREMIUM,
    );
    assert.equal(picked?.id, "old");
  });

  test("prefers a subscription awaiting payment over a newer ended one", () => {
    const picked = pickMostRelevantSubscription(
      [sub({ id: "due", status: "past_due", created: 100 }), sub({ id: "gone", status: "canceled", created: 200 })],
      PREMIUM,
    );
    assert.equal(picked?.id, "due");
  });

  test("prefers a premium price over an entitled subscription on an unknown price", () => {
    const picked = pickMostRelevantSubscription(
      [sub({ id: "other", price: "price_other", created: 200 }), sub({ id: "premium", created: 100 })],
      PREMIUM,
    );
    assert.equal(picked?.id, "premium");
  });

  test("falls back to the newest when every subscription has ended", () => {
    const picked = pickMostRelevantSubscription(
      [sub({ id: "a", status: "canceled", created: 100 }), sub({ id: "b", status: "incomplete_expired", created: 200 })],
      PREMIUM,
    );
    assert.equal(picked?.id, "b");
  });

  test("returns null for a customer without subscriptions", () => {
    assert.equal(pickMostRelevantSubscription([], PREMIUM), null);
  });
});

describe("toSubscriptionSnapshot", () => {
  test("premium requires an entitled status and an allowed price", () => {
    assert.equal(toSubscriptionSnapshot(sub(), PREMIUM).isPremium, true);
    assert.equal(toSubscriptionSnapshot(sub({ price: "price_premium_annual" }), PREMIUM).isPremium, true);
    assert.equal(toSubscriptionSnapshot(sub({ price: "price_other" }), PREMIUM).isPremium, false);
    assert.equal(toSubscriptionSnapshot(sub({ status: "past_due" }), PREMIUM).isPremium, false);
  });

  test("finds the premium price among several items", () => {
    const snapshot = toSubscriptionSnapshot(
      sub({
        items: {
          data: [
            { price: { id: "price_addon" }, current_period_end: PERIOD_END },
            { price: { id: "price_premium" }, current_period_end: PERIOD_END },
          ],
        },
      }),
      PREMIUM,
    );
    assert.equal(snapshot.stripePriceId, "price_premium");
    assert.equal(snapshot.isPremium, true);
  });

  test("maps period end, cancellation and trial fields", () => {
    const active = toSubscriptionSnapshot(sub(), PREMIUM);
    assert.equal(active.stripeCurrentPeriodEnd?.getTime(), PERIOD_END * 1000);
    assert.equal(active.cancelAtPeriodEnd, false);
    assert.equal(active.trialEnd, null);

    const cancelling = toSubscriptionSnapshot(sub({ cancel_at_period_end: true }), PREMIUM);
    assert.equal(cancelling.cancelAtPeriodEnd, true);

    const scheduled = toSubscriptionSnapshot(sub({ cancel_at: PERIOD_END - 3600 }), PREMIUM);
    assert.equal(scheduled.cancelAtPeriodEnd, true);
    assert.equal(scheduled.stripeCurrentPeriodEnd?.getTime(), (PERIOD_END - 3600) * 1000);

    // Cancelling after a later renewal: this period still renews.
    const later = toSubscriptionSnapshot(sub({ cancel_at: PERIOD_END + 86_400 * 60 }), PREMIUM);
    assert.equal(later.cancelAtPeriodEnd, false);
    assert.equal(later.stripeCurrentPeriodEnd?.getTime(), PERIOD_END * 1000);

    const trialing = toSubscriptionSnapshot(
      sub({ status: "trialing", trial_start: PERIOD_END - 86_400 * 7, trial_end: PERIOD_END }),
      PREMIUM,
    );
    assert.equal(trialing.isPremium, true);
    assert.equal(trialing.trialEnd?.getTime(), PERIOD_END * 1000);

    const ended = toSubscriptionSnapshot(sub({ status: "canceled", cancel_at_period_end: true }), PREMIUM);
    assert.equal(ended.cancelAtPeriodEnd, false);
  });

  test("no subscription clears every field", () => {
    assert.deepEqual(toSubscriptionSnapshot(null, PREMIUM), EMPTY_SNAPSHOT);
  });
});

describe("snapshotDiffers", () => {
  const snapshot = toSubscriptionSnapshot(sub(), PREMIUM);

  test("equal values (including equal dates) are unchanged", () => {
    const stored = { ...snapshot, stripeCurrentPeriodEnd: new Date(PERIOD_END * 1000) };
    assert.equal(snapshotDiffers(stored, snapshot), false);
  });

  test("detects changed dates, flags and nulls", () => {
    assert.equal(snapshotDiffers({ ...snapshot, stripeCurrentPeriodEnd: new Date(0) }, snapshot), true);
    assert.equal(snapshotDiffers({ ...snapshot, stripeCurrentPeriodEnd: null }, snapshot), true);
    assert.equal(snapshotDiffers({ ...snapshot, cancelAtPeriodEnd: true }, snapshot), true);
    assert.equal(snapshotDiffers(EMPTY_SNAPSHOT, snapshot), true);
  });
});

describe("trials", () => {
  test("earliestTrialStart returns the first trial across subscriptions", () => {
    assert.equal(earliestTrialStart([sub(), sub()]), null);
    assert.equal(
      earliestTrialStart([sub({ trial_start: 300 }), sub({ trial_start: 200 }), sub()])?.getTime(),
      200_000,
    );
  });

  test("eligible only when enabled, never trialed and never subscribed", () => {
    assert.equal(isTrialEligible(billingUser(), 7), true);
    assert.equal(isTrialEligible(billingUser(), 0), false);
    assert.equal(isTrialEligible(billingUser({ trialUsedAt: new Date() }), 7), false);
    assert.equal(isTrialEligible(billingUser({ subscriptionStatus: "canceled" }), 7), false);
    assert.equal(isTrialEligible(billingUser({ stripeSubscriptionId: "sub_legacy" }), 7), false);
  });
});

describe("premiumTransition", () => {
  test("labels upgrades and downgrades only", () => {
    assert.equal(premiumTransition(false, true), "premium.upgraded");
    assert.equal(premiumTransition(true, false), "premium.downgraded");
    assert.equal(premiumTransition(true, true), null);
    assert.equal(premiumTransition(false, false), null);
  });
});

describe("toSubscriptionStatus", () => {
  const now = new Date("2026-10-15T12:00:00.000Z");
  const future = new Date("2026-11-15T12:00:00.000Z");

  test("returns exactly the PLAN §2.4 fields", () => {
    assert.deepEqual(Object.keys(toSubscriptionStatus(billingUser(), 0, now)).sort(), [
      "cancelAtPeriodEnd",
      "hasBillingAccount",
      "isPremium",
      "paymentIssue",
      "status",
      "stripeCurrentPeriodEnd",
      "stripePriceId",
      "stripeSubscriptionId",
      "trialDays",
      "trialEligible",
      "trialEnd",
    ]);
  });

  test("never-subscribed user", () => {
    const status = toSubscriptionStatus(billingUser(), 7, now);
    assert.equal(status.status, "none");
    assert.equal(status.isPremium, false);
    assert.equal(status.hasBillingAccount, false);
    assert.equal(status.trialEligible, true);
    assert.equal(status.trialDays, 7);
  });

  test("active subscription set to cancel", () => {
    const status = toSubscriptionStatus(
      billingUser({
        isPremium: true,
        subscriptionStatus: "active",
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: "sub_1",
        stripePriceId: "price_premium",
        stripeCurrentPeriodEnd: future,
        cancelAtPeriodEnd: true,
      }),
      7,
      now,
    );
    assert.equal(status.isPremium, true);
    assert.equal(status.status, "active");
    assert.equal(status.cancelAtPeriodEnd, true);
    assert.equal(status.stripeCurrentPeriodEnd, future.toISOString());
    assert.equal(status.paymentIssue, false);
    assert.equal(status.hasBillingAccount, true);
    assert.equal(status.trialEligible, false);
  });

  test("payment issue for past_due, unpaid and incomplete", () => {
    for (const subscriptionStatus of ["past_due", "unpaid", "incomplete"]) {
      const status = toSubscriptionStatus(
        billingUser({ subscriptionStatus, stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_1" }),
        0,
        now,
      );
      assert.equal(status.paymentIssue, true, subscriptionStatus);
      assert.equal(status.isPremium, false, subscriptionStatus);
    }
  });

  test("trialing exposes the trial end", () => {
    const status = toSubscriptionStatus(
      billingUser({ isPremium: true, subscriptionStatus: "trialing", stripeCurrentPeriodEnd: future, trialEnd: future }),
      7,
      now,
    );
    assert.equal(status.status, "trialing");
    assert.equal(status.trialEnd, future.toISOString());
  });

  test("rows written before the status was stored", () => {
    const premium = billingUser({ isPremium: true, stripeCurrentPeriodEnd: future, stripeSubscriptionId: "sub_1" });
    assert.equal(toSubscriptionStatus(premium, 0, now).status, "active");
    assert.equal(toSubscriptionStatus(billingUser({ subscriptionStatus: "bogus" }), 0, now).status, "none");
  });
});

describe("isActivePremium renewal grace", () => {
  const periodEnd = new Date("2026-10-15T00:00:00.000Z");
  const at = (ms: number) => new Date(periodEnd.getTime() + ms);
  const user = { isPremium: true, stripeCurrentPeriodEnd: periodEnd };

  test("stays premium briefly past the period end while renewal is confirmed", () => {
    assert.equal(isActivePremium(user, at(-1)), true);
    assert.equal(isActivePremium(user, at(PREMIUM_RENEWAL_GRACE_MS - 1)), true);
    assert.equal(isActivePremium(user, at(PREMIUM_RENEWAL_GRACE_MS)), false);
  });

  test("no grace for a subscription set to cancel", () => {
    assert.equal(isActivePremium({ ...user, cancelAtPeriodEnd: true }, at(-1)), true);
    assert.equal(isActivePremium({ ...user, cancelAtPeriodEnd: true }, at(1)), false);
  });

  test("requires the premium flag and a period end", () => {
    assert.equal(isActivePremium({ ...user, isPremium: false }, at(-1)), false);
    assert.equal(isActivePremium({ isPremium: true, stripeCurrentPeriodEnd: null }), false);
  });
});

describe("classifyRedelivery", () => {
  const createdAt = new Date("2026-10-15T12:00:00.000Z");
  const now = createdAt.getTime();

  test("acknowledges an event that was processed", () => {
    assert.equal(classifyRedelivery({ processedAt: new Date(now), createdAt }, now + 10), "skip");
  });

  test("asks Stripe to retry while another attempt is running", () => {
    assert.equal(classifyRedelivery({ processedAt: null, createdAt }, now + 1000), "in_progress");
  });

  test("reclaims an attempt that looks abandoned", () => {
    assert.equal(
      classifyRedelivery({ processedAt: null, createdAt }, now + WEBHOOK_EVENT_STALE_MS + 1),
      "reclaim",
    );
  });
});
