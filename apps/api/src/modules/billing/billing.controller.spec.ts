import "reflect-metadata";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { BillingController } from "./billing.controller";

/* @nestjs/throttler metadata keys (prefix + throttler name; not exported by the package). */
const SKIP = "THROTTLER:SKIP";
const LIMIT = "THROTTLER:LIMIT";
/** The throttlers configured in app.module (PLAN contract). */
const THROTTLER_NAMES = ["default", "burst"];

describe("BillingController throttling", () => {
  test("the Stripe webhook skips every throttler", () => {
    const handler = BillingController.prototype.handleWebhook;
    for (const name of THROTTLER_NAMES) {
      assert.equal(Reflect.getMetadata(SKIP + name, handler), true, name);
    }
  });

  test("routes that call Stripe carry the tighter per-route limit", () => {
    for (const handler of [
      BillingController.prototype.createCheckout,
      BillingController.prototype.verifyCheckout,
      BillingController.prototype.createPortal,
    ]) {
      assert.equal(Reflect.getMetadata(`${LIMIT}default`, handler), 10, handler.name);
    }
  });
});
