import { strict as assert } from "node:assert";
import {
  getCheckoutSessionSubscriptionId,
  isCheckoutSessionTerminal,
  shouldReusePendingCheckoutSession,
} from "./checkout-session.util";

type TestCase = { name: string; run: () => void };

const tests: TestCase[] = [
  {
    name: "terminal checkout statuses are complete and expired only",
    run: () => {
      assert.equal(isCheckoutSessionTerminal("complete"), true);
      assert.equal(isCheckoutSessionTerminal("expired"), true);
      assert.equal(isCheckoutSessionTerminal("open"), false);
    },
  },
  {
    name: "extracts subscription ID from string and object forms",
    run: () => {
      const fromString = getCheckoutSessionSubscriptionId({
        subscription: "sub_123",
      } as never);
      const fromObject = getCheckoutSessionSubscriptionId({
        subscription: { id: "sub_456" },
      } as never);
      const fromNull = getCheckoutSessionSubscriptionId({
        subscription: null,
      } as never);

      assert.equal(fromString, "sub_123");
      assert.equal(fromObject, "sub_456");
      assert.equal(fromNull, null);
    },
  },
  {
    name: "reuses pending checkout session only when open subscription session has url and is not expired",
    run: () => {
      const now = Date.now();

      assert.equal(
        shouldReusePendingCheckoutSession({
          mode: "subscription",
          status: "open",
          url: "https://checkout.stripe.com/c/pay/cs_test_123",
          expiresAtMs: now + 60_000,
          nowMs: now,
        }),
        true,
      );

      assert.equal(
        shouldReusePendingCheckoutSession({
          mode: "payment",
          status: "open",
          url: "https://checkout.stripe.com/c/pay/cs_test_123",
          expiresAtMs: now + 60_000,
          nowMs: now,
        }),
        false,
      );

      assert.equal(
        shouldReusePendingCheckoutSession({
          mode: "subscription",
          status: "complete",
          url: "https://checkout.stripe.com/c/pay/cs_test_123",
          expiresAtMs: now + 60_000,
          nowMs: now,
        }),
        false,
      );

      assert.equal(
        shouldReusePendingCheckoutSession({
          mode: "subscription",
          status: "open",
          url: null,
          expiresAtMs: now + 60_000,
          nowMs: now,
        }),
        false,
      );

      assert.equal(
        shouldReusePendingCheckoutSession({
          mode: "subscription",
          status: "open",
          url: "https://checkout.stripe.com/c/pay/cs_test_123",
          expiresAtMs: now - 1,
          nowMs: now,
        }),
        false,
      );
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
