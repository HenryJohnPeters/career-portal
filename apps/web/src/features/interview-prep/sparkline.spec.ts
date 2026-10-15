import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildSparkline } from "./sparkline";

describe("buildSparkline", () => {
  test("maps 0-100 onto the box with y growing downwards", () => {
    const { path, points } = buildSparkline([0, 50, 100], 104, 54, 100, 2);
    assert.equal(path, "M2 52 L52 27 L102 2");
    assert.deepEqual(points.map((p) => p.value), [0, 50, 100]);
  });

  test("leaves gaps for null values", () => {
    const { path, points } = buildSparkline([10, null, 30, 40], 100, 100, 100, 0);
    assert.equal(path, "M0 90 M66.67 70 L100 60");
    assert.equal(points.length, 3);
  });

  test("clamps values and centres a single point", () => {
    const { path } = buildSparkline([150], 100, 100, 100, 0);
    assert.equal(path, "M50 0");
  });

  test("returns an empty path for empty input or a degenerate box", () => {
    assert.deepEqual(buildSparkline([], 100, 20), { path: "", points: [] });
    assert.deepEqual(buildSparkline([1, 2], 0, 20), { path: "", points: [] });
  });
});
