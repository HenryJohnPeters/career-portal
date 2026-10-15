import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { AI_DAILY_ATTEMPT_CAP, FREE_TIER, PREMIUM_FAIR_USE } from "../../common/constants";
import {
  CooldownException,
  FairUseLimitException,
  QuotaExceededException,
} from "../../common/errors";
import { limitsFor } from "../../common/plan";
import {
  MAX_IN_FLIGHT_AI_CALLS,
  PENDING_TTL_MS,
  evaluateAiQuota,
  normaliseUnits,
  tallyAiUsage,
  tallyWindowStart,
  toAiQuotaException,
  type AiUsageRow,
  type AiUsageTally,
} from "./ai-quota";

const NOW = new Date("2026-10-15T12:00:00.000Z");
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

function row(status: string, msAgo: number): AiUsageRow {
  return { status, createdAt: new Date(NOW.getTime() - msAgo) };
}

function rows(count: number, status: string, msAgo: number): AiUsageRow[] {
  return Array.from({ length: count }, () => row(status, msAgo));
}

const EMPTY: AiUsageTally = tallyAiUsage([], NOW);
const free = limitsFor(false);
const premium = limitsFor(true);

describe("tallyWindowStart", () => {
  test("is the month start mid-month", () => {
    assert.equal(tallyWindowStart(NOW).toISOString(), "2026-10-01T00:00:00.000Z");
  });

  test("reaches into the previous month on the 1st, for the 24h window", () => {
    const early = new Date("2026-10-01T06:00:00.000Z");
    assert.equal(tallyWindowStart(early).toISOString(), "2026-09-30T06:00:00.000Z");
  });
});

describe("tallyAiUsage", () => {
  test("counts succeeded and fresh pending rows; never failed or stale pending", () => {
    const tally = tallyAiUsage(
      [
        row("succeeded", 2 * HOUR),
        row("pending", 1 * MIN),
        row("pending", PENDING_TTL_MS + MIN), // abandoned
        row("failed", 30 * MIN),
      ],
      NOW,
    );
    assert.equal(tally.countedThisMonth, 2);
    assert.equal(tally.countedLast24h, 2);
    assert.equal(tally.attemptsLast24h, 4);
    assert.equal(tally.inFlight, 1);
  });

  test("separates the calendar month from the trailing 24h", () => {
    const tally = tallyAiUsage(
      [
        row("succeeded", 3 * 24 * HOUR), // this month, not last 24h
        row("succeeded", 20 * 24 * HOUR), // previous month (Sept 25)
        row("failed", 23 * HOUR),
      ],
      NOW,
    );
    assert.equal(tally.countedThisMonth, 1);
    assert.equal(tally.countedLast24h, 0);
    assert.equal(tally.attemptsLast24h, 1);
  });

  test("tracks the oldest counted row and the oldest attempt in the last 24h", () => {
    const tally = tallyAiUsage(
      [row("succeeded", 5 * HOUR), row("failed", 10 * HOUR), row("succeeded", 2 * HOUR)],
      NOW,
    );
    assert.equal(tally.oldestCountedLast24h?.getTime(), NOW.getTime() - 5 * HOUR);
    assert.equal(tally.oldestAttemptLast24h?.getTime(), NOW.getTime() - 10 * HOUR);
  });
});

describe("evaluateAiQuota — free plan", () => {
  test("allows usage below the monthly quota", () => {
    const tally = tallyAiUsage(rows(FREE_TIER.monthlyAiActions - 1, "succeeded", 3 * 24 * HOUR), NOW);
    assert.deepEqual(evaluateAiQuota(tally, free, 1, NOW), { ok: true });
  });

  test("refuses at the monthly quota, resetting at the next UTC month", () => {
    const tally = tallyAiUsage(rows(FREE_TIER.monthlyAiActions, "succeeded", 3 * 24 * HOUR), NOW);
    const verdict = evaluateAiQuota(tally, free, 1, NOW);
    assert.deepEqual(verdict, {
      ok: false,
      kind: "quota",
      limit: FREE_TIER.monthlyAiActions,
      used: FREE_TIER.monthlyAiActions,
      resetsAt: new Date("2026-11-01T00:00:00.000Z"),
    });
  });

  test("failed attempts do not use up the quota", () => {
    const tally = tallyAiUsage(
      [...rows(FREE_TIER.monthlyAiActions - 1, "succeeded", 3 * 24 * HOUR), ...rows(5, "failed", 3 * 24 * HOUR)],
      NOW,
    );
    assert.equal(evaluateAiQuota(tally, free, 1, NOW).ok, true);
  });

  test("in-flight reservations count, so concurrent requests cannot overshoot", () => {
    const tally = tallyAiUsage(
      [...rows(FREE_TIER.monthlyAiActions - 1, "succeeded", 3 * 24 * HOUR), row("pending", MIN)],
      NOW,
    );
    const verdict = evaluateAiQuota(tally, free, 1, NOW);
    assert.equal(verdict.ok, false);
    assert.equal(!verdict.ok && verdict.kind, "quota");
  });

  test("multi-unit reservations need room for every unit", () => {
    const tally = tallyAiUsage(rows(FREE_TIER.monthlyAiActions - 1, "succeeded", 3 * 24 * HOUR), NOW);
    assert.equal(evaluateAiQuota(tally, free, 2, NOW).ok, false);
  });

  test("the daily attempt cap counts failures and gives a rolling Retry-After", () => {
    const failures = [
      row("failed", 20 * HOUR), // oldest: frees up in 4h
      ...rows(AI_DAILY_ATTEMPT_CAP.free - 1, "failed", HOUR),
    ];
    const verdict = evaluateAiQuota(tallyAiUsage(failures, NOW), free, 1, NOW);
    assert.deepEqual(verdict, {
      ok: false,
      kind: "attempt_cap",
      retryAfterSeconds: 4 * 60 * 60,
    });
  });
});

describe("evaluateAiQuota — premium fair use", () => {
  test("has no monthly quota below the fair-use caps", () => {
    const tally = tallyAiUsage(rows(100, "succeeded", 3 * 24 * HOUR), NOW);
    assert.deepEqual(evaluateAiQuota(tally, premium, 1, NOW), { ok: true });
  });

  test("daily fair use: retry when the oldest counted row ages out", () => {
    const counted = [
      row("succeeded", 23 * HOUR),
      ...rows(PREMIUM_FAIR_USE.dailyAiActions - 1, "succeeded", HOUR),
    ];
    const verdict = evaluateAiQuota(tallyAiUsage(counted, NOW), premium, 1, NOW);
    assert.deepEqual(verdict, {
      ok: false,
      kind: "fair_use_daily",
      limit: PREMIUM_FAIR_USE.dailyAiActions,
      retryAfterSeconds: 60 * 60,
    });
  });

  test("monthly fair use: retry at the next UTC month", () => {
    const tally = tallyAiUsage(rows(PREMIUM_FAIR_USE.monthlyAiActions, "succeeded", 3 * 24 * HOUR), NOW);
    const verdict = evaluateAiQuota(tally, premium, 1, NOW);
    assert.equal(!verdict.ok && verdict.kind, "fair_use_monthly");
    assert.equal(
      !verdict.ok && "retryAfterSeconds" in verdict && verdict.retryAfterSeconds,
      (new Date("2026-11-01T00:00:00.000Z").getTime() - NOW.getTime()) / 1000,
    );
  });

  test("the premium attempt cap still applies", () => {
    const tally = tallyAiUsage(rows(AI_DAILY_ATTEMPT_CAP.premium, "failed", HOUR), NOW);
    const verdict = evaluateAiQuota(tally, premium, 1, NOW);
    assert.equal(!verdict.ok && verdict.kind, "attempt_cap");
  });
});

describe("evaluateAiQuota — in-flight limit", () => {
  test("refuses more than MAX_IN_FLIGHT_AI_CALLS concurrent calls", () => {
    const tally = tallyAiUsage(rows(MAX_IN_FLIGHT_AI_CALLS, "pending", MIN), NOW);
    const verdict = evaluateAiQuota(tally, premium, 1, NOW);
    assert.equal(!verdict.ok && verdict.kind, "in_flight");
  });

  test("stale pending rows do not block new calls", () => {
    const tally = tallyAiUsage(rows(MAX_IN_FLIGHT_AI_CALLS, "pending", PENDING_TTL_MS + MIN), NOW);
    assert.equal(evaluateAiQuota(tally, premium, 1, NOW).ok, true);
  });

  test("an empty history is always allowed", () => {
    assert.deepEqual(evaluateAiQuota(EMPTY, free, 1, NOW), { ok: true });
  });
});

describe("toAiQuotaException", () => {
  test("quota → 403 quota_exceeded with the shared details", () => {
    const error = toAiQuotaException({
      ok: false,
      kind: "quota",
      limit: 10,
      used: 10,
      resetsAt: new Date("2026-11-01T00:00:00.000Z"),
    });
    assert.ok(error instanceof QuotaExceededException);
    assert.equal(error.getStatus(), 403);
    assert.deepEqual((error.getResponse() as { details: unknown }).details, {
      reason: "quota_exceeded",
      quota: "aiActions",
      limit: 10,
      used: 10,
      resetsAt: "2026-11-01T00:00:00.000Z",
    });
  });

  test("fair use and attempt cap → 429 fair_use_limit; in-flight → 429 cooldown", () => {
    for (const kind of ["fair_use_daily", "fair_use_monthly"] as const) {
      const error = toAiQuotaException({ ok: false, kind, limit: 40, retryAfterSeconds: 60 });
      assert.ok(error instanceof FairUseLimitException);
      assert.equal(error.getStatus(), 429);
    }
    const capped = toAiQuotaException({ ok: false, kind: "attempt_cap", retryAfterSeconds: 9 });
    assert.ok(capped instanceof FairUseLimitException);
    assert.deepEqual((capped.getResponse() as { details: unknown }).details, {
      reason: "fair_use_limit",
      retryAfterSeconds: 9,
    });
    const busy = toAiQuotaException({ ok: false, kind: "in_flight", retryAfterSeconds: 5 });
    assert.ok(busy instanceof CooldownException);
  });
});

describe("normaliseUnits", () => {
  test("defaults to 1 and clamps to 1..3", () => {
    assert.equal(normaliseUnits(undefined), 1);
    assert.equal(normaliseUnits(0), 1);
    assert.equal(normaliseUnits(2.7), 2);
    assert.equal(normaliseUnits(99), 3);
    assert.equal(normaliseUnits(Number.NaN), 1);
  });
});
