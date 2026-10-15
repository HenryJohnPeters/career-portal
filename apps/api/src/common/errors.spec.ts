import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { HttpStatus } from "@nestjs/common";
import {
  CooldownException,
  FairUseLimitException,
  PremiumRequiredException,
  QuotaExceededException,
} from "./errors";

function body(e: { getResponse(): unknown }) {
  return e.getResponse() as { message: string; details: unknown };
}

describe("shared HTTP exceptions", () => {
  test("QuotaExceededException → 403 with quota details", () => {
    const e = new QuotaExceededException(
      "aiActions",
      10,
      10,
      new Date("2026-11-01T00:00:00.000Z"),
    );
    assert.equal(e.getStatus(), HttpStatus.FORBIDDEN);
    assert.deepEqual(body(e).details, {
      reason: "quota_exceeded",
      quota: "aiActions",
      limit: 10,
      used: 10,
      resetsAt: "2026-11-01T00:00:00.000Z",
    });
    assert.match(body(e).message, /10 AI actions/);
  });

  test("QuotaExceededException with no reset date describes a standing cap", () => {
    const e = new QuotaExceededException("cvVersions", 2, 2, null);
    assert.equal(
      (body(e).details as { resetsAt: unknown }).resetsAt,
      null,
    );
    assert.match(body(e).message, /up to 2 CV versions/);
  });

  test("custom messages override the default", () => {
    const e = new QuotaExceededException("techTests", 3, 3, null, "Custom");
    assert.equal(body(e).message, "Custom");
  });

  test("PremiumRequiredException → 403 with feature", () => {
    const e = new PremiumRequiredException("tailorKit");
    assert.equal(e.getStatus(), HttpStatus.FORBIDDEN);
    assert.deepEqual(body(e).details, {
      reason: "premium_required",
      feature: "tailorKit",
    });
    assert.match(body(e).message, /Premium/);
  });

  test("FairUseLimitException → 429 with whole retry seconds", () => {
    const e = new FairUseLimitException(12.2);
    assert.equal(e.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
    assert.deepEqual(body(e).details, {
      reason: "fair_use_limit",
      retryAfterSeconds: 13,
    });
  });

  test("CooldownException → 429 and never a zero/negative retry", () => {
    const e = new CooldownException(0);
    assert.equal(e.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
    assert.deepEqual(body(e).details, {
      reason: "cooldown",
      retryAfterSeconds: 1,
    });
  });
});
