import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanDisplayName,
  defaultDisplayName,
  toUserResponse,
  type UserResponseRow,
} from "./user-profile";

const HOUR = 60 * 60 * 1000;

function row(overrides: Partial<UserResponseRow> = {}): UserResponseRow {
  return {
    id: "u1",
    email: "user@example.com",
    name: "User",
    isPremium: false,
    stripeCurrentPeriodEnd: null,
    subscriptionStatus: null,
    cancelAtPeriodEnd: false,
    createdAt: new Date("2026-01-02T03:04:05.000Z"),
    onboardingDismissedAt: null,
    ...overrides,
  };
}

describe("toUserResponse", () => {
  test("free user: exact shared User keys, ISO dates", () => {
    const res = toUserResponse(row());
    assert.deepEqual(Object.keys(res).sort(), [
      "createdAt",
      "email",
      "id",
      "isPremium",
      "isTrialing",
      "name",
      "onboardingDismissedAt",
      "plan",
      "stripeCurrentPeriodEnd",
    ]);
    assert.equal(res.plan, "free");
    assert.equal(res.isPremium, false);
    assert.equal(res.createdAt, "2026-01-02T03:04:05.000Z");
    assert.equal(res.stripeCurrentPeriodEnd, null);
  });

  test("active premium is computed on the server", () => {
    const periodEnd = new Date(Date.now() + 10 * 24 * HOUR);
    const res = toUserResponse(
      row({ isPremium: true, stripeCurrentPeriodEnd: periodEnd, subscriptionStatus: "active" }),
    );
    assert.equal(res.plan, "premium");
    assert.equal(res.isPremium, true);
    assert.equal(res.stripeCurrentPeriodEnd, periodEnd.toISOString());
  });

  test("a stale isPremium flag past the period end (and grace) is free", () => {
    const res = toUserResponse(
      row({ isPremium: true, stripeCurrentPeriodEnd: new Date(Date.now() - 2 * 24 * HOUR) }),
    );
    assert.equal(res.plan, "free");
    assert.equal(res.isPremium, false);
  });

  test("a subscription set to cancel gets no renewal grace", () => {
    const justEnded = new Date(Date.now() - HOUR);
    assert.equal(
      toUserResponse(row({ isPremium: true, stripeCurrentPeriodEnd: justEnded })).plan,
      "premium",
    );
    assert.equal(
      toUserResponse(
        row({ isPremium: true, stripeCurrentPeriodEnd: justEnded, cancelAtPeriodEnd: true }),
      ).plan,
      "free",
    );
  });

  test("isTrialing only while the trial actually grants premium", () => {
    const future = new Date(Date.now() + 24 * HOUR);
    const past = new Date(Date.now() - 3 * 24 * HOUR);
    assert.equal(
      toUserResponse(row({ isPremium: true, stripeCurrentPeriodEnd: future, subscriptionStatus: "trialing" })).isTrialing,
      true,
    );
    assert.equal(
      toUserResponse(row({ isPremium: true, stripeCurrentPeriodEnd: past, subscriptionStatus: "trialing" })).isTrialing,
      false,
    );
  });
});

describe("display names", () => {
  test("cleanDisplayName strips control characters, collapses whitespace and caps at 80", () => {
    assert.equal(cleanDisplayName("  Jane\u0000\n\t Doe "), "Jane Doe");
    assert.equal(cleanDisplayName("x".repeat(200)).length, 80);
    assert.equal(cleanDisplayName("\u0007 \n"), "");
  });

  test("defaultDisplayName uses the email local part, else 'User'", () => {
    assert.equal(defaultDisplayName("jane.doe@example.com"), "jane.doe");
    assert.equal(defaultDisplayName("@example.com"), "User");
  });
});
