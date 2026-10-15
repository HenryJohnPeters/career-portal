import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildCountSparkline, buildFunnelSteps, formatRate } from "./insights";

describe("formatRate", () => {
  test("formats whole percentages and handles missing values", () => {
    assert.equal(formatRate(42), "42%");
    assert.equal(formatRate(41.6), "42%");
    assert.equal(formatRate(0), "0%");
    assert.equal(formatRate(140), "100%");
    assert.equal(formatRate(null), "—");
    assert.equal(formatRate(undefined), "—");
    assert.equal(formatRate(Number.NaN), "—");
  });
});

describe("buildFunnelSteps", () => {
  test("bars are shares of applied applications", () => {
    const steps = buildFunnelSteps({ total: 12, applied: 10, responded: 4, interviewing: 2, offers: 1, rejected: 3 });
    assert.deepEqual(
      steps.map((s) => [s.key, s.value, s.percent]),
      [
        ["applied", 10, 100],
        ["responded", 4, 40],
        ["interviewing", 2, 20],
        ["offers", 1, 10],
      ],
    );
  });

  test("nothing applied gives empty bars", () => {
    const steps = buildFunnelSteps({ total: 3, applied: 0, responded: 0, interviewing: 0, offers: 0, rejected: 0 });
    assert.ok(steps.every((s) => s.percent === 0));
  });
});

describe("buildCountSparkline", () => {
  test("scales to the largest count with 0 at the bottom", () => {
    const { points, line, area } = buildCountSparkline([0, 2, 4], 100, 20, 0);
    assert.deepEqual(points, [
      { x: 0, y: 20, value: 0 },
      { x: 50, y: 10, value: 2 },
      { x: 100, y: 0, value: 4 },
    ]);
    assert.equal(line, "M0 20 L50 10 L100 0");
    assert.equal(area, "M0 20 L50 10 L100 0 L100 20 L0 20 Z");
  });

  test("an all-zero series is a flat line; empty input draws nothing", () => {
    const flat = buildCountSparkline([0, 0], 10, 10, 0);
    assert.ok(flat.points.every((p) => p.y === 10));
    assert.deepEqual(buildCountSparkline([], 10, 10), { line: "", area: "", points: [] });
  });
});
