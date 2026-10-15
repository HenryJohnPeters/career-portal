import { test } from "node:test";
import { strict as assert } from "node:assert";
import { BadRequestException } from "@nestjs/common";
import type { TechnicalTest } from "@prisma/client";
import {
  AI_REVIEW_CLAIM_TTL_MS,
  AI_SCENARIO_VARIETY_CHANCE,
  TEST_STATUS,
  aiReviewState,
  buildSelfReview,
  canSubmit,
  isSubmitted,
  readEvaluation,
  readScenario,
  shouldTryAiScenario,
  suggestedMinutes,
} from "./technical-tests.rules";
import { toSummary, toTestView, type TechnicalTestSummaryRow } from "./technical-tests.view";

/* ── State machine ─────────────────────────────────────────────────── */

test("only unsubmitted tests can be submitted", () => {
  assert.equal(canSubmit(TEST_STATUS.notStarted), true);
  assert.equal(canSubmit(TEST_STATUS.inProgress), true);
  assert.equal(canSubmit(TEST_STATUS.submitted), false);
  assert.equal(canSubmit(TEST_STATUS.evaluated), false);
  assert.equal(canSubmit("bogus"), false);
});

test("submitted and legacy evaluated tests count as submitted", () => {
  assert.equal(isSubmitted(TEST_STATUS.submitted), true);
  assert.equal(isSubmitted(TEST_STATUS.evaluated), true);
  assert.equal(isSubmitted(TEST_STATUS.notStarted), false);
  assert.equal(isSubmitted(TEST_STATUS.inProgress), false);
});

/* ── AI scenario decision ──────────────────────────────────────────── */

test("free users never get AI scenarios", () => {
  for (const roll of [0, 0.1, 0.9]) {
    assert.equal(
      shouldTryAiScenario({ isPremium: false, tagCount: 3, tagMatches: 0, roll }),
      false,
    );
  }
});

test("premium: AI on a weak tag match, or occasionally for variety", () => {
  const high = AI_SCENARIO_VARIETY_CHANCE + 0.1;
  assert.equal(shouldTryAiScenario({ isPremium: true, tagCount: 2, tagMatches: 0, roll: high }), true);
  assert.equal(shouldTryAiScenario({ isPremium: true, tagCount: 2, tagMatches: 1, roll: high }), false);
  // No tags is not a weak match.
  assert.equal(shouldTryAiScenario({ isPremium: true, tagCount: 0, tagMatches: 0, roll: high }), false);
  assert.equal(shouldTryAiScenario({ isPremium: true, tagCount: 0, tagMatches: 0, roll: 0 }), true);
});

/* ── Suggested time ────────────────────────────────────────────────── */

test("suggestedMinutes reads the upper bound of an estimate", () => {
  assert.equal(suggestedMinutes("1–2 hours"), 120);
  assert.equal(suggestedMinutes("6–10 hours"), 600);
  assert.equal(suggestedMinutes("3-4 hours"), 240);
  assert.equal(suggestedMinutes("2 to 3 hrs"), 180);
  assert.equal(suggestedMinutes("1.5 hours"), 90);
  assert.equal(suggestedMinutes("90 minutes"), 90);
  assert.equal(suggestedMinutes("45-60 min"), 60);
});

test("suggestedMinutes clamps and falls back to 0 (no timer)", () => {
  assert.equal(suggestedMinutes("5 minutes"), 15);
  assert.equal(suggestedMinutes("40 hours"), 720);
  assert.equal(suggestedMinutes("about a day"), 0);
  assert.equal(suggestedMinutes("3 months"), 0);
  assert.equal(suggestedMinutes(""), 0);
  assert.equal(suggestedMinutes(undefined), 0);
});

/* ── Self-review ───────────────────────────────────────────────────── */

const NOW = new Date("2026-10-15T12:00:00.000Z");

test("buildSelfReview sorts ratings, trims notes and stamps the time", () => {
  const review = buildSelfReview(
    {
      ratings: [
        { criterionIndex: 2, score: 3 },
        { criterionIndex: 0, score: 1 },
      ],
      notes: "  More tests next time.  ",
    },
    3,
    NOW,
  );
  assert.deepStrictEqual(review, {
    ratings: [
      { criterionIndex: 0, score: 1 },
      { criterionIndex: 2, score: 3 },
    ],
    notes: "More tests next time.",
    reviewedAt: NOW.toISOString(),
  });
});

test("buildSelfReview drops blank notes", () => {
  const review = buildSelfReview({ ratings: [{ criterionIndex: 0, score: 0 }], notes: "   " }, 1, NOW);
  assert.equal("notes" in review, false);
});

test("buildSelfReview rejects invalid ratings", () => {
  const bad: [Parameters<typeof buildSelfReview>[0], number][] = [
    [{ ratings: [{ criterionIndex: 3, score: 1 }] }, 3],
    [{ ratings: [{ criterionIndex: -1, score: 1 }] }, 3],
    [{ ratings: [{ criterionIndex: 1.5, score: 1 }] }, 3],
    [{ ratings: [{ criterionIndex: 0, score: 4 }] }, 3],
    [{ ratings: [{ criterionIndex: 0, score: 1.5 }] }, 3],
    [{ ratings: [{ criterionIndex: 0, score: 1 }, { criterionIndex: 0, score: 2 }] }, 3],
    [{ ratings: [] }, 3],
    [{ ratings: [{ criterionIndex: 0, score: 1 }] }, 0],
    [{ ratings: [{ criterionIndex: 0, score: 1 }], notes: "x".repeat(5_001) }, 3],
  ];
  for (const [input, count] of bad) {
    assert.throws(() => buildSelfReview(input, count, NOW), BadRequestException, JSON.stringify(input).slice(0, 80));
  }
});

/* ── AI review claim ───────────────────────────────────────────────── */

test("aiReviewState: done, pending and expired claims", () => {
  const review = { summary: "s", strengths: [], improvements: [], criteria: [], reviewedAt: NOW.toISOString() };
  assert.equal(aiReviewState(null, NOW), "available");
  assert.equal(aiReviewState({ aiReview: review }, NOW), "done");
  const recent = new Date(NOW.getTime() - 60_000).toISOString();
  assert.equal(aiReviewState({ aiReviewPendingSince: recent }, NOW), "pending");
  const stale = new Date(NOW.getTime() - AI_REVIEW_CLAIM_TTL_MS - 1).toISOString();
  assert.equal(aiReviewState({ aiReviewPendingSince: stale }, NOW), "available");
  assert.equal(aiReviewState({ aiReviewPendingSince: "garbage" }, NOW), "available");
});

/* ── Stored JSON ───────────────────────────────────────────────────── */

const SCENARIO = {
  title: "T",
  brief: "B",
  requirements: [{ key: "K", text: "Text" }],
  evaluationCriteria: [{ name: "N", weight: 100, description: "D" }],
  hints: [],
};

test("readScenario accepts well-formed scenarios and rejects malformed ones", () => {
  assert.deepStrictEqual(readScenario(SCENARIO), {
    title: "T",
    brief: "B",
    requirements: SCENARIO.requirements,
    evaluationCriteria: SCENARIO.evaluationCriteria,
  });
  assert.equal(readScenario(null), null);
  assert.equal(readScenario([]), null);
  assert.equal(readScenario({ ...SCENARIO, title: 3 }), null);
  assert.equal(readScenario({ ...SCENARIO, requirements: [{ key: "K" }] }), null);
  assert.equal(readScenario({ ...SCENARIO, evaluationCriteria: [{ name: "N", weight: "10" }] }), null);
});

test("readEvaluation needs a checklist percentage", () => {
  assert.equal(readEvaluation(null), null);
  assert.equal(readEvaluation({ selfReview: {} }), null);
  assert.ok(readEvaluation({ percentage: 40 }));
});

/* ── Views ─────────────────────────────────────────────────────────── */

const ROW: TechnicalTestSummaryRow = {
  id: "0b6c5a0e-8a47-4b8e-9d55-5d6d3b0b9f10",
  title: "T",
  track: "frontend",
  level: "mid",
  difficulty: "medium",
  roleFocus: "frontend",
  tags: ["react"],
  timeLimit: 240,
  status: "submitted",
  createdAt: NOW,
  startedAt: NOW,
  submittedAt: NOW,
  score: 72.6,
  grade: "B",
  hasAiReview: null,
};

test("toSummary rounds and clamps the checklist score", () => {
  assert.equal(toSummary(ROW).score, 73);
  assert.equal(toSummary({ ...ROW, score: 140 }).score, 100);
  assert.equal(toSummary({ ...ROW, score: -3 }).score, 0);
  assert.equal(toSummary(ROW).hasAiReview, false);
  assert.equal(toSummary({ ...ROW, hasAiReview: true }).hasAiReview, true);
});

test("toSummary has no grade without a score", () => {
  const summary = toSummary({ ...ROW, score: null, grade: "B" });
  assert.equal(summary.score, null);
  assert.equal(summary.grade, null);
});

test("toTestView hides deletedAt and the AI review claim", () => {
  const row = {
    id: ROW.id,
    userId: "u",
    title: "T",
    track: "frontend",
    level: "mid",
    difficulty: "medium",
    roleFocus: "frontend",
    tags: [],
    timeLimit: 0,
    scenario: SCENARIO,
    status: "submitted",
    submission: "x",
    evaluation: { percentage: 10, aiReviewPendingSince: NOW.toISOString() },
    startedAt: NOW,
    submittedAt: NOW,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  } as TechnicalTest;
  const view = toTestView(row);
  assert.equal("deletedAt" in view, false);
  assert.deepStrictEqual(view.evaluation, { percentage: 10 });
  assert.equal(toTestView({ ...row, evaluation: null }).evaluation, null);
});
