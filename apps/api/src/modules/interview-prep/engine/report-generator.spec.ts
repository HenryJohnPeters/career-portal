import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { generateReport, type ScoredQuestion } from "./report-generator";

function scored(i: number, score: number, overrides: Partial<ScoredQuestion> = {}): ScoredQuestion {
  return {
    questionId: `q${i}`,
    prompt: `Question ${i}`,
    type: "theory",
    score,
    maxScore: 10,
    pointsMissed: score > 0 ? [] : [`missed ${i}`],
    tags: ["react"],
    ...overrides,
  };
}

describe("generateReport", () => {
  test("2 correct out of 10 is 20%, not the old 200%", () => {
    const answers = Array.from({ length: 10 }, (_, i) => scored(i, i < 2 ? 10 : 0));
    const report = generateReport("frontend", "junior", answers, 10);
    assert.equal(report.overallScore, 20);
    assert.equal(report.maxPossibleScore, 100);
    assert.equal(report.percentage, 20);
    assert.equal(report.grade, "F");
  });

  test("legacy scores stored on the rubric scale are clamped to maxScore", () => {
    // Pre-fix rows stored 100 for a correct answer against maxScore 10.
    const answers = [scored(1, 100), scored(2, 100), scored(3, 0)];
    const report = generateReport("frontend", "junior", answers, 3);
    assert.equal(report.overallScore, 20);
    assert.equal(report.maxPossibleScore, 30);
    assert.equal(report.percentage, 67);
    assert.ok(report.questionBreakdown.every((q) => q.score <= q.maxScore));
  });

  test("percentage stays within [0, 100] for any input", () => {
    const cases: ScoredQuestion[][] = [
      [],
      [scored(1, -5)],
      [scored(1, Number.NaN)],
      [scored(1, 10, { maxScore: 0 })],
      [scored(1, 1e9)],
    ];
    for (const answers of cases) {
      const report = generateReport("backend", "mid", answers, answers.length);
      assert.ok(report.percentage >= 0 && report.percentage <= 100, JSON.stringify(report));
      assert.ok(Number.isFinite(report.overallScore));
    }
  });

  test("an early finish covers the answered questions and says so", () => {
    const report = generateReport("frontend", "mid", [scored(1, 10)], 10);
    assert.equal(report.percentage, 100);
    assert.equal(report.answeredCount, 1);
    assert.equal(report.questionCount, 10);
    assert.match(report.trackSummary, /1 of 10 questions/);
  });

  test("strengths and study areas use display labels", () => {
    const report = generateReport(
      "backend",
      "mid",
      [
        scored(1, 10, { tags: ["node.js"] }),
        scored(2, 0, { tags: ["postgresql"], type: "system-design" }),
      ],
      2,
    );
    assert.ok(report.strengths.includes("Good knowledge of Node.js"));
    assert.ok(report.suggestedStudyAreas.some((s) => s.includes("PostgreSQL")));
    assert.ok(report.weaknesses.includes("Needs improvement in system design questions"));
  });
});
