import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  clampPercentage,
  clampScore,
  computeGrade,
  toPercentage,
} from "./grade.util";

describe("grade utilities", () => {
  test("computeGrade boundaries", () => {
    assert.equal(computeGrade(100), "A+");
    assert.equal(computeGrade(90), "A+");
    assert.equal(computeGrade(89.9), "A");
    assert.equal(computeGrade(70), "B");
    assert.equal(computeGrade(60), "C");
    assert.equal(computeGrade(50), "D");
    assert.equal(computeGrade(49), "F");
  });

  test("computeGrade tolerates out-of-range and NaN input", () => {
    assert.equal(computeGrade(250), "A+");
    assert.equal(computeGrade(-5), "F");
    assert.equal(computeGrade(Number.NaN), "F");
  });

  test("clampPercentage keeps values in [0, 100]", () => {
    assert.equal(clampPercentage(120), 100);
    assert.equal(clampPercentage(-1), 0);
    assert.equal(clampPercentage(42.5), 42.5);
    assert.equal(clampPercentage(Number.POSITIVE_INFINITY), 0);
  });

  test("clampScore keeps values in [0, maxScore]", () => {
    assert.equal(clampScore(12, 10), 10);
    assert.equal(clampScore(-3, 10), 0);
    assert.equal(clampScore(7.5, 10), 7.5);
    assert.equal(clampScore(5, 0), 0);
    assert.equal(clampScore(Number.NaN, 10), 0);
  });

  test("toPercentage rounds and guards against a zero max", () => {
    assert.equal(toPercentage(7, 10), 70);
    assert.equal(toPercentage(2, 3), 67);
    assert.equal(toPercentage(15, 10), 100);
    assert.equal(toPercentage(3, 0), 0);
  });
});
