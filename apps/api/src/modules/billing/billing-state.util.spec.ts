import { strict as assert } from "node:assert";
import {
  isEntitledSubscriptionStatus,
  isPremiumEntitled,
  pickMostRelevantSubscription,
} from "./billing-state.util";

type TestCase = { name: string; run: () => void };

const tests: TestCase[] = [
  {
    name: "entitled statuses include active and trialing only",
    run: () => {
      assert.equal(isEntitledSubscriptionStatus("active"), true);
      assert.equal(isEntitledSubscriptionStatus("trialing"), true);
      assert.equal(isEntitledSubscriptionStatus("past_due"), false);
      assert.equal(isEntitledSubscriptionStatus("canceled"), false);
      assert.equal(isEntitledSubscriptionStatus("incomplete"), false);
      assert.equal(isEntitledSubscriptionStatus("unpaid"), false);
    },
  },
  {
    name: "premium entitlement requires entitled status and matching price",
    run: () => {
      assert.equal(
        isPremiumEntitled({
          status: "active",
          priceId: "price_expected",
          expectedPriceId: "price_expected",
        }),
        true,
      );

      assert.equal(
        isPremiumEntitled({
          status: "active",
          priceId: "price_other",
          expectedPriceId: "price_expected",
        }),
        false,
      );

      assert.equal(
        isPremiumEntitled({
          status: "past_due",
          priceId: "price_expected",
          expectedPriceId: "price_expected",
        }),
        false,
      );
    },
  },
  {
    name: "most relevant subscription prefers active/trialing over newer non-entitled statuses",
    run: () => {
      const chosen = pickMostRelevantSubscription([
        { created: 200, status: "canceled" as const },
        { created: 100, status: "active" as const },
      ]);

      assert.ok(chosen);
      assert.equal(chosen?.status, "active");
    },
  },
  {
    name: "most relevant subscription falls back to newest when none are entitled",
    run: () => {
      const chosen = pickMostRelevantSubscription([
        { created: 100, status: "past_due" as const },
        { created: 200, status: "canceled" as const },
      ]);

      assert.ok(chosen);
      assert.equal(chosen?.status, "canceled");
      assert.equal(chosen?.created, 200);
    },
  },
];

let failed = false;
for (const test of tests) {
  try {
    test.run();
    console.log(`PASS: ${test.name}`);
  } catch (err) {
    failed = true;
    console.error(`FAIL: ${test.name}`);
    console.error(err);
  }
}

if (failed) {
  process.exitCode = 1;
}
