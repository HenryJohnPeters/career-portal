import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  INSIGHT_WEEKS,
  buildJobInsights,
  percent,
  startOfUtcWeek,
  type InsightsJobRow,
} from "./jobs-insights";

// Wednesday 15 Oct 2026, 13:00 UTC.
const NOW = new Date("2026-10-15T13:00:00Z");

const job = (
  status: string,
  overrides: Partial<InsightsJobRow> = {},
): InsightsJobRow => ({
  status,
  appliedAt: null,
  createdAt: new Date("2026-10-14T10:00:00Z"),
  cvVersionId: null,
  ...overrides,
});

const build = (rows: InsightsJobRow[], includeByCv = false, titles = new Map<string, string>()) =>
  buildJobInsights(rows, { now: NOW, includeByCv, cvTitles: titles });

describe("percent", () => {
  test("rounds to whole percentages and is null without a denominator", () => {
    assert.equal(percent(1, 3), 33);
    assert.equal(percent(2, 3), 67);
    assert.equal(percent(0, 0), null);
  });
});

describe("startOfUtcWeek", () => {
  test("returns Monday 00:00 UTC", () => {
    assert.equal(startOfUtcWeek(NOW).toISOString(), "2026-10-12T00:00:00.000Z");
    assert.equal(
      startOfUtcWeek(new Date("2026-10-18T23:59:59Z")).toISOString(),
      "2026-10-12T00:00:00.000Z",
    );
    assert.equal(
      startOfUtcWeek(new Date("2026-10-19T00:00:00Z")).toISOString(),
      "2026-10-19T00:00:00.000Z",
    );
  });
});

describe("buildJobInsights", () => {
  const rows = [
    job("wishlist"),
    job("applied"),
    job("applied"),
    job("rejected"),
    job("phone_screen"),
    job("onsite"),
    job("accepted"),
    job("ghosted"), // legacy → rejected
    job("interview"), // legacy → phone_screen
  ];

  test("counts each funnel stage as 'reached at least'", () => {
    assert.deepEqual(build(rows).funnel, {
      total: 9,
      applied: 8,
      responded: 4,
      interviewing: 2,
      offers: 1,
      rejected: 2,
    });
  });

  test("rates are percentages of applied jobs", () => {
    assert.deepEqual(build(rows).rates, { response: 50, interview: 25, offer: 13 });
    assert.deepEqual(build([job("wishlist")]).rates, {
      response: null,
      interview: null,
      offer: null,
    });
  });

  test("weekly volume covers 12 weeks, oldest first, by appliedAt else createdAt", () => {
    const weekly = build([
      job("applied", { appliedAt: new Date("2026-10-13T09:00:00Z") }),
      job("applied", { appliedAt: null, createdAt: new Date("2026-10-12T00:00:00Z") }),
      job("applied", { appliedAt: new Date("2026-10-11T23:59:59Z") }),
      job("applied", { appliedAt: new Date("2026-07-01T00:00:00Z") }), // > 12 weeks ago
      job("wishlist", { createdAt: new Date("2026-10-13T00:00:00Z") }), // not applied
    ]).weekly;
    assert.equal(weekly.length, INSIGHT_WEEKS);
    assert.equal(weekly[0].weekStart, "2026-07-27");
    assert.deepEqual(weekly[INSIGHT_WEEKS - 1], { weekStart: "2026-10-12", count: 2 });
    assert.deepEqual(weekly[INSIGHT_WEEKS - 2], { weekStart: "2026-10-05", count: 1 });
    assert.equal(
      weekly.reduce((sum, w) => sum + w.count, 0),
      3,
    );
  });

  test("free plan: per-CV breakdown is locked", () => {
    const insights = build(rows);
    assert.equal(insights.byCvVersion, null);
    assert.equal(insights.locked, true);
  });

  test("premium: response rate per CV version, most used first", () => {
    const insights = build(
      [
        job("applied", { cvVersionId: "a" }),
        job("phone_screen", { cvVersionId: "a" }),
        job("rejected", { cvVersionId: "a" }),
        job("accepted", { cvVersionId: "b" }),
        job("wishlist", { cvVersionId: "b" }), // not an application
        job("applied"), // no CV linked
      ],
      true,
      new Map([
        ["a", "Master CV"],
        ["b", "Frontend CV"],
      ]),
    );
    assert.equal(insights.locked, false);
    assert.deepEqual(insights.byCvVersion, [
      { cvVersionId: "a", title: "Master CV", applications: 3, responses: 1, responseRate: 33 },
      { cvVersionId: "b", title: "Frontend CV", applications: 1, responses: 1, responseRate: 100 },
    ]);
  });
});
