import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { Prisma, PrismaClient } from "@prisma/client";
import { AI_DAILY_ATTEMPT_CAP, FREE_TIER, PREMIUM_FAIR_USE } from "./constants";
import {
  DAY_MS,
  USER_LOCK_TX_OPTIONS,
  buildUsageMeter,
  getMonthWindow,
  getTrailingDayWindow,
  limitsFor,
  lockedTransaction,
  modelTierFor,
  resolvePlan,
  retryAfterForRollingWindow,
  secondsUntil,
  userLockKey,
  withUserLock,
} from "./plan";

describe("getMonthWindow", () => {
  test("returns the UTC month containing `now` and the next month start", () => {
    const { start, nextStart } = getMonthWindow(
      new Date("2026-10-15T13:45:00.000Z"),
    );
    assert.equal(start.toISOString(), "2026-10-01T00:00:00.000Z");
    assert.equal(nextStart.toISOString(), "2026-11-01T00:00:00.000Z");
  });

  test("rolls December over into the next year", () => {
    const { start, nextStart } = getMonthWindow(
      new Date("2026-12-31T23:59:59.999Z"),
    );
    assert.equal(start.toISOString(), "2026-12-01T00:00:00.000Z");
    assert.equal(nextStart.toISOString(), "2027-01-01T00:00:00.000Z");
  });

  test("the first instant of a month belongs to that month", () => {
    const { start } = getMonthWindow(new Date("2026-03-01T00:00:00.000Z"));
    assert.equal(start.toISOString(), "2026-03-01T00:00:00.000Z");
  });

  test("uses UTC, not the local timezone offset", () => {
    // 23:30 at UTC-05:00 on Feb 28 is already March 1 in UTC.
    const { start } = getMonthWindow(new Date("2026-02-28T23:30:00-05:00"));
    assert.equal(start.toISOString(), "2026-03-01T00:00:00.000Z");
  });

  test("defaults to the current time", () => {
    const { start, nextStart } = getMonthWindow();
    const now = Date.now();
    assert.ok(start.getTime() <= now && now < nextStart.getTime());
  });
});

describe("trailing-day window and Retry-After helpers", () => {
  test("getTrailingDayWindow starts exactly 24h before now", () => {
    const now = new Date("2026-10-15T12:00:00.000Z");
    const { start, end } = getTrailingDayWindow(now);
    assert.equal(start.toISOString(), "2026-10-14T12:00:00.000Z");
    assert.equal(end, now);
    assert.equal(end.getTime() - start.getTime(), DAY_MS);
  });

  test("secondsUntil rounds up and never returns less than 1", () => {
    const now = new Date("2026-10-15T12:00:00.000Z");
    assert.equal(secondsUntil(new Date("2026-10-15T12:00:01.200Z"), now), 2);
    assert.equal(secondsUntil(new Date("2026-10-15T13:00:00.000Z"), now), 3600);
    assert.equal(secondsUntil(new Date("2026-10-15T11:00:00.000Z"), now), 1);
  });

  test("retryAfterForRollingWindow waits until the oldest row ages out", () => {
    const now = new Date("2026-10-15T12:00:00.000Z");
    const oldest = new Date("2026-10-14T18:00:00.000Z");
    assert.equal(retryAfterForRollingWindow(oldest, DAY_MS, now), 6 * 3600);
  });
});

describe("limitsFor", () => {
  test("free limits mirror FREE_TIER and the free attempt cap", () => {
    const limits = limitsFor(false);
    assert.equal(limits.cvVersions, FREE_TIER.cvVersions);
    assert.equal(limits.coverLetters, FREE_TIER.coverLetters);
    assert.equal(limits.monthlyAiActions, FREE_TIER.monthlyAiActions);
    assert.equal(limits.monthlyMockSessions, FREE_TIER.monthlyMockSessions);
    assert.equal(limits.monthlyQuestions, FREE_TIER.monthlyQuestions);
    assert.equal(limits.monthlyTechTests, FREE_TIER.monthlyTechTests);
    assert.equal(limits.interviewerCount, FREE_TIER.interviewerCount);
    assert.deepEqual(limits.templateIds, FREE_TIER.templateIds);
    assert.equal(limits.fairUse, null);
    assert.equal(limits.dailyAiAttemptCap, AI_DAILY_ATTEMPT_CAP.free);
  });

  test("premium is unlimited except for fair use and the attempt cap", () => {
    const limits = limitsFor(true);
    assert.equal(limits.cvVersions, null);
    assert.equal(limits.coverLetters, null);
    assert.equal(limits.monthlyAiActions, null);
    assert.equal(limits.monthlyMockSessions, null);
    assert.equal(limits.monthlyQuestions, null);
    assert.equal(limits.monthlyTechTests, null);
    assert.equal(limits.interviewerCount, null);
    assert.equal(limits.templateIds, null);
    assert.deepEqual(limits.fairUse, {
      monthlyAiActions: PREMIUM_FAIR_USE.monthlyAiActions,
      dailyAiActions: PREMIUM_FAIR_USE.dailyAiActions,
    });
    assert.equal(limits.dailyAiAttemptCap, AI_DAILY_ATTEMPT_CAP.premium);
  });

  test("product decisions from PLAN §1.1", () => {
    assert.deepEqual(
      {
        cvVersions: FREE_TIER.cvVersions,
        coverLetters: FREE_TIER.coverLetters,
        monthlyAiActions: FREE_TIER.monthlyAiActions,
        monthlyMockSessions: FREE_TIER.monthlyMockSessions,
        monthlyQuestions: FREE_TIER.monthlyQuestions,
        monthlyTechTests: FREE_TIER.monthlyTechTests,
        interviewerCount: FREE_TIER.interviewerCount,
      },
      {
        cvVersions: 2,
        coverLetters: 5,
        monthlyAiActions: 10,
        monthlyMockSessions: 5,
        monthlyQuestions: 75,
        monthlyTechTests: 3,
        interviewerCount: 3,
      },
    );
    assert.deepEqual(
      { ...PREMIUM_FAIR_USE },
      { monthlyAiActions: 300, dailyAiActions: 40 },
    );
    assert.deepEqual({ ...AI_DAILY_ATTEMPT_CAP }, { free: 15, premium: 80 });
  });

  test("returns a fresh object each call (callers cannot mutate shared state)", () => {
    assert.notEqual(limitsFor(true), limitsFor(true));
    assert.notEqual(limitsFor(false), limitsFor(false));
  });
});

describe("resolvePlan", () => {
  const future = new Date(Date.now() + DAY_MS);
  const past = new Date(Date.now() - DAY_MS);

  test("active premium gets the standard model and premium limits", () => {
    const plan = resolvePlan({
      isPremium: true,
      stripeCurrentPeriodEnd: future,
      subscriptionStatus: "active",
    });
    assert.equal(plan.plan, "premium");
    assert.equal(plan.isPremium, true);
    assert.equal(plan.isTrialing, false);
    assert.equal(plan.modelTier, "standard");
    assert.equal(plan.limits.monthlyAiActions, null);
  });

  test("a lapsed period end is free even if the flag is still set", () => {
    const plan = resolvePlan({
      isPremium: true,
      stripeCurrentPeriodEnd: past,
      subscriptionStatus: "active",
    });
    assert.equal(plan.plan, "free");
    assert.equal(plan.isPremium, false);
    assert.equal(plan.modelTier, "light");
    assert.equal(plan.limits.monthlyAiActions, FREE_TIER.monthlyAiActions);
  });

  test("isTrialing follows subscriptionStatus", () => {
    const plan = resolvePlan({
      isPremium: true,
      stripeCurrentPeriodEnd: future,
      subscriptionStatus: "trialing",
    });
    assert.equal(plan.isTrialing, true);
    assert.equal(plan.isPremium, true);
  });

  test("modelTierFor maps plans to model tiers", () => {
    assert.equal(modelTierFor(true), "standard");
    assert.equal(modelTierFor(false), "light");
  });
});

describe("buildUsageMeter", () => {
  test("computes remaining and serialises resetsAt", () => {
    assert.deepEqual(
      buildUsageMeter(3, 10, new Date("2026-11-01T00:00:00.000Z")),
      {
        used: 3,
        limit: 10,
        remaining: 7,
        resetsAt: "2026-11-01T00:00:00.000Z",
      },
    );
  });

  test("remaining never goes negative", () => {
    assert.equal(buildUsageMeter(12, 10, null).remaining, 0);
  });

  test("unlimited meters have null limit and remaining", () => {
    assert.deepEqual(buildUsageMeter(42, null, null), {
      used: 42,
      limit: null,
      remaining: null,
      resetsAt: null,
    });
  });
});

describe("withUserLock", () => {
  function fakeTx() {
    const calls: { strings: readonly string[]; values: unknown[] }[] = [];
    const tx = {
      $executeRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
        calls.push({ strings: [...strings], values });
        return 1;
      },
    };
    return { tx: tx as unknown as Prisma.TransactionClient, calls };
  }

  test("takes a transaction-scoped advisory lock with the key as a bound parameter", async () => {
    const { tx, calls } = fakeTx();
    const key = "ai:'); DROP TABLE \"User\"; --";
    await withUserLock(tx, key);

    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].values, [key]);
    const sql = calls[0].strings.join("$1");
    assert.equal(sql, "SELECT pg_advisory_xact_lock(hashtext($1))");
    assert.ok(!calls[0].strings.join("").includes(key));
  });

  test("userLockKey namespaces keys by scope", () => {
    assert.equal(userLockKey("ai", "u1"), "ai:u1");
    assert.notEqual(userLockKey("cv", "u1"), userLockKey("ai", "u1"));
  });

  test("lockedTransaction locks before running the callback and passes timeouts", async () => {
    const order: string[] = [];
    let options: unknown;
    const tx = {
      $executeRaw: async () => {
        order.push("lock");
        return 1;
      },
    };
    const prisma = {
      $transaction: async (
        fn: (client: unknown) => Promise<unknown>,
        opts: unknown,
      ) => {
        options = opts;
        return fn(tx);
      },
    } as unknown as PrismaClient;

    const result = await lockedTransaction(prisma, "cv:u1", async () => {
      order.push("work");
      return "done";
    });

    assert.equal(result, "done");
    assert.deepEqual(order, ["lock", "work"]);
    assert.deepEqual(options, USER_LOCK_TX_OPTIONS);
  });
});
