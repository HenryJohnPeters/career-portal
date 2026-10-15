import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { AnswerFeedback, InterviewSessionSummary } from "@careerportal/shared/types";
import {
  correctIndicesOf,
  encodeAnswer,
  findRecoveredSession,
  formatOptionLetters,
  optionLetter,
  selectedIndicesOf,
  toggleChoice,
} from "./answer";

describe("answer helpers", () => {
  test("letters", () => {
    assert.equal(optionLetter(0), "A");
    assert.equal(optionLetter(3), "D");
    assert.equal(formatOptionLetters([2, 0]), "A, C");
  });

  test("single choice replaces, multi-select toggles", () => {
    assert.deepEqual(toggleChoice([1], 2, false), [2]);
    assert.deepEqual(toggleChoice([3], 1, true), [1, 3]);
    assert.deepEqual(toggleChoice([1, 3], 1, true), [3]);
  });

  test("encodes answers as sorted unique indices", () => {
    assert.equal(encodeAnswer([2]), "2");
    assert.equal(encodeAnswer([3, 0, 3]), "0,3");
    assert.equal(encodeAnswer([-1, 1.5, 2]), "2");
    assert.equal(encodeAnswer([]), "");
  });

  const feedback = (extra: Partial<AnswerFeedback>): AnswerFeedback => ({
    pointsHit: [],
    pointsMissed: [],
    redFlagsTriggered: [],
    criteriaScores: [],
    suggestions: [],
    personaResponse: "",
    correctAnswer: "",
    correctOptionIndex: 1,
    selectedOptionIndex: 2,
    isCorrect: false,
    ...extra,
  });

  test("reads single and multi-select feedback", () => {
    assert.deepEqual(correctIndicesOf(feedback({})), [1]);
    assert.deepEqual(correctIndicesOf(feedback({ correctOptionIndices: [0, 2] })), [0, 2]);
    assert.deepEqual(selectedIndicesOf(feedback({})), [2]);
    assert.deepEqual(selectedIndicesOf(feedback({ selectedOptionIndex: -1 })), []);
    assert.deepEqual(selectedIndicesOf(feedback({ selectedOptionIndices: [1, 3] })), [1, 3]);
  });
});

describe("findRecoveredSession", () => {
  const summary = (id: string, extra: Partial<InterviewSessionSummary> = {}): InterviewSessionSummary => ({
    id,
    status: "in_progress",
    track: "frontend",
    level: "mid",
    difficulty: "medium",
    interviewType: "coding",
    interviewerId: "none",
    questionCount: 10,
    answeredCount: 0,
    totalScore: null,
    percentage: null,
    grade: null,
    createdAt: "2026-10-15T12:00:00.000Z",
    updatedAt: "2026-10-15T12:00:00.000Z",
    ...extra,
  });
  const since = Date.parse("2026-10-15T12:00:00.000Z");

  test("picks the new in-progress session when the previous list is known", () => {
    const sessions = [summary("new"), summary("old")];
    const found = findRecoveredSession(sessions, { track: "frontend", level: "mid", since, knownIds: new Set(["old"]) });
    assert.equal(found?.id, "new");
  });

  test("ignores other configurations and finished sessions", () => {
    const sessions = [summary("a", { track: "backend" }), summary("b", { status: "completed" }), summary("c", { level: "senior" })];
    assert.equal(findRecoveredSession(sessions, { track: "frontend", level: "mid", since, knownIds: new Set() }), null);
  });

  test("falls back to creation time when the previous list was not loaded", () => {
    const sessions = [summary("recent", { createdAt: "2026-10-15T11:59:30.000Z" }), summary("stale", { createdAt: "2026-10-15T11:00:00.000Z" })];
    assert.equal(findRecoveredSession(sessions, { track: "frontend", level: "mid", since, knownIds: null })?.id, "recent");
    assert.equal(
      findRecoveredSession([sessions[1]], { track: "frontend", level: "mid", since, knownIds: null }),
      null,
    );
  });
});
