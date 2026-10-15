import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  TREND_WEEKS,
  buildProgress,
  buildWeeklyTrend,
  trendWindowStart,
  weekStartUtc,
  type ProgressInput,
} from "./interview-progress";

const NOW = new Date("2026-10-15T12:00:00Z"); // a Thursday

function input(overrides: Partial<ProgressInput> = {}): ProgressInput {
  return {
    isPremium: false,
    sessions: 4,
    completedSessions: 3,
    byType: [
      { key: "theory", answered: 10, correct: 6 },
      { key: "coding", answered: 5, correct: 1 },
    ],
    byTag: [
      { key: "react", answered: 8, correct: 6 },
      { key: "node", answered: 2, correct: 0 },
      { key: "node.js", answered: 2, correct: 1 },
      { key: "css", answered: 4, correct: 1 },
      { key: "typescript", answered: 3, correct: 3 },
      { key: "free text junk", answered: 9, correct: 0 },
      { key: "docker", answered: 2, correct: 0 },
    ],
    byWeek: [],
    now: NOW,
    ...overrides,
  };
}

describe("buildProgress", () => {
  test("totals and accuracy come from all answers", () => {
    const progress = buildProgress(input());
    assert.deepEqual(progress.totals, {
      sessions: 4,
      completedSessions: 3,
      answered: 15,
      correct: 7,
      accuracy: 47,
    });
  });

  test("no answers → accuracy null", () => {
    const progress = buildProgress(input({ byType: [], byTag: [] }));
    assert.equal(progress.totals.accuracy, null);
    assert.deepEqual(progress.weakTopics, []);
  });

  test("free: top 3 weak topics only, breakdowns locked", () => {
    const progress = buildProgress(input());
    assert.equal(progress.locked, true);
    assert.equal(progress.byTag, null);
    assert.equal(progress.byType, null);
    assert.equal(progress.weeklyTrend, null);
    // node + node.js merge into node.js (4 answers, 25%); docker has too few answers;
    // typescript is perfect; unknown tags are ignored.
    assert.deepEqual(progress.weakTopics, [
      { tag: "css", answered: 4, accuracy: 25 },
      { tag: "node.js", answered: 4, accuracy: 25 },
      { tag: "react", answered: 8, accuracy: 75 },
    ]);
  });

  test("premium: full breakdown and a 12-week trend", () => {
    const progress = buildProgress(
      input({
        isPremium: true,
        byWeek: [{ weekStart: new Date("2026-10-12T00:00:00Z"), answered: 4, correct: 3 }],
      }),
    );
    assert.equal(progress.locked, false);
    assert.deepEqual(progress.byType, [
      { type: "theory", answered: 10, correct: 6, accuracy: 60 },
      { type: "coding", answered: 5, correct: 1, accuracy: 20 },
    ]);
    assert.ok(progress.byTag);
    assert.deepEqual(
      progress.byTag.map((t) => t.tag),
      ["react", "css", "node.js", "typescript", "docker"],
    );
    assert.ok(progress.byTag.every((t) => t.accuracy >= 0 && t.accuracy <= 100));
    assert.ok(progress.weeklyTrend);
    assert.equal(progress.weeklyTrend.length, TREND_WEEKS);
    assert.deepEqual(progress.weeklyTrend.at(-1), { weekStart: "2026-10-12", answered: 4, accuracy: 75 });
    assert.deepEqual(progress.weeklyTrend[0], { weekStart: "2026-07-27", answered: 0, accuracy: null });
  });

  test("correct counts above answered (bad legacy data) never exceed 100%", () => {
    const progress = buildProgress(
      input({ isPremium: true, byType: [{ key: "theory", answered: 2, correct: 5 }], byTag: [] }),
    );
    assert.equal(progress.totals.correct, 2);
    assert.equal(progress.totals.accuracy, 100);
    assert.equal(progress.byType?.[0].correct, 2);
  });
});

describe("weeks", () => {
  test("weekStartUtc is Monday 00:00 UTC", () => {
    assert.equal(weekStartUtc(NOW).toISOString(), "2026-10-12T00:00:00.000Z");
    assert.equal(weekStartUtc(new Date("2026-10-12T00:00:00Z")).toISOString(), "2026-10-12T00:00:00.000Z");
    assert.equal(weekStartUtc(new Date("2026-10-18T23:59:59Z")).toISOString(), "2026-10-12T00:00:00.000Z");
  });

  test("the trend window starts 11 weeks before the current week", () => {
    assert.equal(trendWindowStart(NOW).toISOString(), "2026-07-27T00:00:00.000Z");
  });

  test("weeks are consecutive and oldest first", () => {
    const trend = buildWeeklyTrend([], NOW);
    for (let i = 1; i < trend.length; i++) {
      const gap = Date.parse(trend[i].weekStart) - Date.parse(trend[i - 1].weekStart);
      assert.equal(gap, 7 * 24 * 60 * 60 * 1000);
    }
  });
});
