import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  ConflictException,
  ServiceUnavailableException,
  type Logger,
} from "@nestjs/common";
import Stripe from "stripe";
import {
  errorLabel,
  isStripeResourceMissing,
  parsePremiumPriceIds,
  parseTrialDays,
  stripeIdOf,
  toBillingHttpError,
} from "./stripe.client";

const silentLogger = { error: () => undefined } as unknown as Logger;

const missingCustomer = new Stripe.errors.StripeInvalidRequestError({
  type: "invalid_request_error",
  code: "resource_missing",
  param: "customer",
  message: "No such customer: 'cus_123'",
});

describe("config parsing", () => {
  test("trial days: whole days in 1..730, anything else disables trials", () => {
    assert.equal(parseTrialDays(undefined), 0);
    assert.equal(parseTrialDays(""), 0);
    assert.equal(parseTrialDays("7"), 7);
    assert.equal(parseTrialDays(14), 14);
    assert.equal(parseTrialDays("0"), 0);
    assert.equal(parseTrialDays("-3"), 0);
    assert.equal(parseTrialDays("7.5"), 0);
    assert.equal(parseTrialDays("abc"), 0);
    assert.equal(parseTrialDays(731), 0);
  });

  test("premium prices: the checkout price plus the optional allowlist", () => {
    assert.deepEqual([...parsePremiumPriceIds("price_a", undefined)], ["price_a"]);
    assert.deepEqual(
      [...parsePremiumPriceIds("price_a", " price_b, ,price_a,price_c ")],
      ["price_a", "price_b", "price_c"],
    );
  });
});

describe("Stripe error matching", () => {
  test("resource_missing is matched by type and code, optionally param", () => {
    assert.equal(isStripeResourceMissing(missingCustomer), true);
    assert.equal(isStripeResourceMissing(missingCustomer, "customer"), true);
    assert.equal(isStripeResourceMissing(missingCustomer, "price"), false);
  });

  test("message text alone never matches", () => {
    assert.equal(isStripeResourceMissing(new Error("No such customer: resource_missing")), false);
    assert.equal(isStripeResourceMissing(null), false);
    assert.equal(
      isStripeResourceMissing(
        new Stripe.errors.StripeInvalidRequestError({
          type: "invalid_request_error",
          code: "parameter_invalid_integer",
          message: "No such customer",
        }),
      ),
      false,
    );
  });

  test("user-facing mapping: idempotency → 409, other Stripe errors → 503, others unchanged", () => {
    const idem = new Stripe.errors.StripeIdempotencyError({ type: "idempotency_error", message: "x" });
    assert.ok(toBillingHttpError(idem, silentLogger, "test") instanceof ConflictException);

    const down = new Stripe.errors.StripeConnectionError({ type: "api_error", message: "socket hang up" });
    const mapped = toBillingHttpError(down, silentLogger, "test");
    assert.ok(mapped instanceof ServiceUnavailableException);
    assert.doesNotMatch((mapped as Error).message, /socket/);
    assert.ok(toBillingHttpError(missingCustomer, silentLogger, "test") instanceof ServiceUnavailableException);

    const plain = new Error("db down");
    assert.equal(toBillingHttpError(plain, silentLogger, "test"), plain);
  });

  test("log label carries the Stripe type and code, never the message", () => {
    assert.equal(errorLabel(missingCustomer), "StripeInvalidRequestError (resource_missing)");
    assert.equal(errorLabel(new TypeError("secret detail")), "TypeError");
    assert.doesNotMatch(errorLabel(missingCustomer), /cus_123/);
  });
});

describe("stripeIdOf", () => {
  test("reads string and expanded references", () => {
    assert.equal(stripeIdOf("cus_1"), "cus_1");
    assert.equal(stripeIdOf({ id: "cus_2" }), "cus_2");
    assert.equal(stripeIdOf(null), null);
    assert.equal(stripeIdOf(undefined), null);
  });
});
