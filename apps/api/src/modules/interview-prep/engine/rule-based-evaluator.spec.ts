import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { correctIndicesOf, evaluateAnswer, parseAnswer } from "./rule-based-evaluator";
import type { GradableQuestion } from "./interfaces";

function question(overrides: Partial<GradableQuestion> = {}): GradableQuestion {
  return {
    options: ["A", "B", "C", "D"],
    correctOptionIndex: 2,
    correctOptionIndices: [],
    multiSelect: false,
    expectedPoints: ["point one", "point two"],
    rubric: {
      criteria: [
        { name: "Core", weight: 3, keywords: [] },
        { name: "Depth", weight: 4, keywords: [] },
        { name: "Usage", weight: 3, keywords: [] },
      ],
    },
    modelAnswer: "C is right because…",
    ...overrides,
  };
}

const multi = question({
  options: ["useState", "useEffect", "useQuery", "useMemo", "useThread", "useCallback"],
  correctOptionIndex: 0,
  correctOptionIndices: [0, 1, 3, 5],
  multiSelect: true,
});

describe("parseAnswer", () => {
  const single = { optionCount: 4, multiSelect: false };

  test("accepts a single index", () => {
    assert.deepEqual(parseAnswer("2", single), { ok: true, indices: [2] });
    assert.deepEqual(parseAnswer(" 3 ", single), { ok: true, indices: [3] });
  });

  test("rejects junk that parseInt would accept", () => {
    assert.equal(parseAnswer("0abc", single).ok, false);
    assert.equal(parseAnswer("", single).ok, false);
    assert.equal(parseAnswer("-1", single).ok, false);
    assert.equal(parseAnswer("1.5", single).ok, false);
  });

  test("rejects out-of-range indices", () => {
    assert.equal(parseAnswer("4", single).ok, false);
    assert.equal(parseAnswer("9", single).ok, false);
  });

  test("single-answer questions take exactly one index", () => {
    assert.equal(parseAnswer("0,1", single).ok, false);
  });

  test("multi-select answers are sorted and de-duplicated", () => {
    assert.deepEqual(parseAnswer("5, 0,3,0", { optionCount: 6, multiSelect: true }), {
      ok: true,
      indices: [0, 3, 5],
    });
  });
});

describe("correctIndicesOf", () => {
  test("single-answer questions use correctOptionIndex", () => {
    assert.deepEqual(correctIndicesOf(question()), [2]);
  });

  test("multi-select questions use correctOptionIndices", () => {
    assert.deepEqual(correctIndicesOf(multi), [0, 1, 3, 5]);
  });

  test("multi-select without indices falls back to correctOptionIndex", () => {
    assert.deepEqual(correctIndicesOf({ ...multi, correctOptionIndices: [] }), [0]);
  });

  test("drops out-of-range stored indices", () => {
    assert.deepEqual(correctIndicesOf({ ...multi, correctOptionIndices: [1, 9, -1] }), [1]);
  });
});

describe("evaluateAnswer", () => {
  test("a correct single answer scores maxScore", () => {
    const result = evaluateAnswer(question(), [2], 10);
    assert.equal(result.isCorrect, true);
    assert.equal(result.score, 10);
    assert.equal(result.maxScore, 10);
    assert.deepEqual(result.pointsHit, ["point one", "point two"]);
    assert.deepEqual(result.pointsMissed, []);
    assert.equal(result.correctAnswer, "C");
    assert.equal(result.correctOptionIndex, 2);
    assert.deepEqual(result.selectedOptionIndices, [2]);
  });

  test("a wrong single answer scores 0 and lists the missed points", () => {
    const result = evaluateAnswer(question(), [1], 10);
    assert.equal(result.isCorrect, false);
    assert.equal(result.score, 0);
    assert.deepEqual(result.pointsMissed, ["point one", "point two"]);
    assert.equal(result.selectedOptionIndex, 1);
    assert.match(result.suggestions[0], /"C"/);
    assert.equal(result.suggestions[1], "C is right because…");
  });

  test("the score never exceeds maxScore whatever the rubric weights", () => {
    const heavy = question({
      rubric: { criteria: [{ name: "x", weight: 50, keywords: [] }, { name: "y", weight: 150, keywords: [] }] },
    });
    const result = evaluateAnswer(heavy, [2], 10);
    assert.equal(result.score, 10);
    const criteriaTotal = result.criteriaScores.reduce((s, c) => s + c.maxScore, 0);
    assert.ok(Math.abs(criteriaTotal - 10) < 0.2);
    assert.ok(result.criteriaScores.every((c) => c.score <= c.maxScore));
  });

  test("multi-select needs exactly the correct set", () => {
    const exact = evaluateAnswer(multi, [5, 3, 1, 0], 10);
    assert.equal(exact.isCorrect, true);
    assert.equal(exact.score, 10);
    assert.deepEqual(exact.correctOptionIndices, [0, 1, 3, 5]);
    assert.equal(exact.correctAnswer, "useState, useEffect, useMemo, useCallback");

    const partial = evaluateAnswer(multi, [1], 10);
    assert.equal(partial.isCorrect, false);
    assert.equal(partial.score, 0);

    const superset = evaluateAnswer(multi, [0, 1, 2, 3, 5], 10);
    assert.equal(superset.isCorrect, false);
  });

  test("a partly right multi-select answer gets per-option feedback, not a contradiction", () => {
    const partial = evaluateAnswer(multi, [0, 1], 10);
    assert.equal(partial.score, 0);
    assert.deepEqual(partial.pointsHit, ["useState", "useEffect"]);
    assert.deepEqual(partial.pointsMissed, ["useMemo", "useCallback"]);
    // No zeroed "False positives" criterion when nothing wrong was picked.
    assert.deepEqual(partial.criteriaScores, []);

    const withWrongPick = evaluateAnswer(multi, [0, 1, 2, 3, 5], 10);
    assert.deepEqual(withWrongPick.pointsHit, ["useState", "useEffect", "useMemo", "useCallback"]);
    assert.deepEqual(withWrongPick.pointsMissed, ['why "useQuery" is not correct']);

    const allWrong = evaluateAnswer(multi, [2, 4], 10);
    assert.deepEqual(allWrong.pointsHit, []);
    assert.deepEqual(allWrong.pointsMissed, [
      "useState",
      "useEffect",
      "useMemo",
      "useCallback",
      'why "useQuery" is not correct',
      'why "useThread" is not correct',
    ]);
  });

  test("a correct multi-select answer keeps the full breakdown", () => {
    const exact = evaluateAnswer(multi, [0, 1, 3, 5], 10);
    assert.deepEqual(exact.pointsHit, ["point one", "point two"]);
    assert.equal(exact.criteriaScores.length, 3);
    assert.ok(exact.criteriaScores.every((c) => c.score === c.maxScore));
  });

  test("picking one correct option of a multi-select question is not graded as the old index-0 answer", () => {
    // The pre-fix evaluator compared against correctOptionIndex (0) only.
    assert.equal(evaluateAnswer(multi, [0], 10).isCorrect, false);
  });

  test("questions without criteria get no criteria scores", () => {
    const result = evaluateAnswer(question({ rubric: { criteria: [] } }), [2], 10);
    assert.deepEqual(result.criteriaScores, []);
  });
});
