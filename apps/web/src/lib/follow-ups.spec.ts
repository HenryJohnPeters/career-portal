import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { countOverdueFollowUps, localDateKey, toDateKey } from "./follow-ups";

describe("follow-up helpers", () => {
  test("toDateKey keeps the calendar date of ISO and date-only values", () => {
    assert.equal(toDateKey("2026-10-14"), "2026-10-14");
    assert.equal(toDateKey("2026-10-14T00:00:00.000Z"), "2026-10-14");
    assert.equal(toDateKey("2026-10-14T23:30:00+10:00"), "2026-10-14");
    assert.equal(toDateKey(null), null);
    assert.equal(toDateKey(""), null);
    assert.equal(toDateKey("not a date"), null);
  });

  test("localDateKey uses local calendar fields", () => {
    assert.equal(localDateKey(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
    assert.equal(localDateKey(new Date(2026, 11, 31, 0, 0)), "2026-12-31");
  });

  test("counts only active jobs due before today", () => {
    const now = new Date(2026, 9, 15, 9, 0); // 15 Oct 2026, local
    const jobs = [
      { status: "applied" as const, followUpDate: "2026-10-14T00:00:00.000Z" }, // overdue
      { status: "phone_screen" as const, followUpDate: "2026-10-01" }, // overdue
      { status: "applied" as const, followUpDate: "2026-10-15T00:00:00.000Z" }, // due today
      { status: "applied" as const, followUpDate: "2026-10-20" }, // upcoming
      { status: "rejected" as const, followUpDate: "2026-10-01" }, // inactive
      { status: "accepted" as const, followUpDate: "2026-10-01" }, // inactive
      { status: "wishlist" as const, followUpDate: null },
    ];
    assert.equal(countOverdueFollowUps(jobs, now), 2);
  });

  test("handles a missing list", () => {
    assert.equal(countOverdueFollowUps(undefined), 0);
    assert.equal(countOverdueFollowUps(null), 0);
    assert.equal(countOverdueFollowUps([]), 0);
  });
});
