import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  parseRubricCriteria,
  toClientSession,
  toClientSessionQuestion,
  toSessionSummary,
  type BankQuestionRow,
  type SessionQuestionRow,
  type SessionRow,
} from "./interview-view";

const ANSWER_KEY_FIELDS = [
  "correctOptionIndex",
  "correctOptionIndices",
  "modelAnswer",
  "expectedPoints",
  "redFlags",
  "rubric",
];

function bankQuestion(overrides: Partial<BankQuestionRow> = {}): BankQuestionRow {
  return {
    id: "iq-1",
    track: "frontend",
    tags: ["react"],
    difficulty: 2,
    type: "theory",
    level: "junior",
    prompt: "What is JSX?",
    options: ["A", "B", "C", "D"],
    multiSelect: false,
    correctOptionIndex: 1,
    correctOptionIndices: [],
    expectedPoints: ["syntax extension"],
    redFlags: ["it is HTML"],
    rubric: { criteria: [{ name: "Core", weight: 3, keywords: ["jsx"] }] },
    modelAnswer: "JSX is a syntax extension.",
    followUpIds: ["iq-2"],
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function sessionQuestion(overrides: Partial<SessionQuestionRow> = {}): SessionQuestionRow {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    sessionId: "00000000-0000-4000-8000-0000000000aa",
    questionId: "iq-1",
    orderIndex: 0,
    userAnswer: null,
    score: null,
    maxScore: 10,
    feedback: null,
    isFollowUp: false,
    parentQuestionId: null,
    answeredAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    question: bankQuestion(),
    ...overrides,
  };
}

describe("answer-key stripping", () => {
  test("unanswered questions carry no answer key", () => {
    const client = toClientSessionQuestion(sessionQuestion());
    for (const field of ANSWER_KEY_FIELDS) {
      assert.equal(field in client.question, false, `${field} leaked`);
    }
    assert.deepEqual(client.question.options, ["A", "B", "C", "D"]);
    assert.deepEqual(client.question.followUpIds, []);
    const serialised = JSON.stringify(client);
    assert.doesNotMatch(serialised, /syntax extension|it is HTML|"rubric"/);
  });

  test("answered questions include the answer key for review", () => {
    const client = toClientSessionQuestion(
      sessionQuestion({ userAnswer: "1", score: 10, answeredAt: new Date() }),
    );
    assert.equal(client.question.correctOptionIndex, 1);
    assert.deepEqual(client.question.correctOptionIndices, [1]);
    assert.equal(client.question.modelAnswer, "JSX is a syntax extension.");
    assert.deepEqual(client.question.rubric, {
      criteria: [{ name: "Core", weight: 3, keywords: ["jsx"] }],
    });
  });

  test("multi-select answer keys list every correct option", () => {
    const client = toClientSessionQuestion(
      sessionQuestion({
        userAnswer: "0,2",
        question: bankQuestion({ multiSelect: true, correctOptionIndex: 0, correctOptionIndices: [2, 0] }),
      }),
    );
    assert.equal(client.question.multiSelect, true);
    assert.deepEqual(client.question.correctOptionIndices, [0, 2]);
  });

  test("never exposes internal bank fields", () => {
    const row = { ...bankQuestion(), source: "ai-generated", generatedForHash: "abc" } as BankQuestionRow;
    const client = toClientSessionQuestion(sessionQuestion({ question: row, userAnswer: "1" }));
    assert.equal("source" in client.question, false);
    assert.equal("generatedForHash" in client.question, false);
  });

  test("whole sessions strip per question", () => {
    const session = {
      id: "s",
      userId: "u",
      track: "frontend",
      level: "junior",
      tags: [],
      roleFocus: "fullstack",
      interviewType: "coding",
      duration: 60,
      difficulty: "easy",
      companyStyle: "startup",
      questionCount: 2,
      persona: "neutral",
      interviewerId: null,
      status: "in_progress",
      totalScore: null,
      report: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      questions: [
        sessionQuestion({ userAnswer: "1" }),
        sessionQuestion({ id: "00000000-0000-4000-8000-000000000002", orderIndex: 1 }),
      ],
    } satisfies SessionRow;
    const client = toClientSession(session);
    assert.equal(client.questions[0].question.correctOptionIndex, 1);
    assert.equal("correctOptionIndex" in client.questions[1].question, false);
  });
});

describe("toSessionSummary", () => {
  const row = {
    id: "s",
    status: "completed",
    track: "frontend",
    level: "mid",
    difficulty: "medium",
    interviewType: "coding",
    interviewerId: "alex",
    questionCount: 5,
    answeredCount: 5,
    totalScore: 30,
    scored: 30,
    possible: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  test("scores completed sessions from the answered rows", () => {
    const summary = toSessionSummary(row);
    assert.equal(summary.percentage, 60);
    assert.equal(summary.grade, "C");
    assert.equal(summary.totalScore, 30);
  });

  test("legacy totals cannot exceed 100% (scores are capped in the query)", () => {
    // 1 of 5 correct, once stored as 100 points: the capped sum is 10 of 50.
    const legacy = toSessionSummary({ ...row, totalScore: 100, scored: 10, possible: 50 });
    assert.equal(legacy.percentage, 20);
    assert.equal(legacy.grade, "F");
    assert.equal(legacy.totalScore, 10);
    assert.equal(toSessionSummary({ ...row, scored: 80, possible: 50 }).percentage, 100);
  });

  test("no score until completed with an answer", () => {
    const pending = toSessionSummary({ ...row, status: "in_progress", totalScore: null });
    assert.equal(pending.percentage, null);
    assert.equal(pending.grade, null);
    assert.equal(pending.totalScore, null);
    const empty = toSessionSummary({ ...row, answeredCount: 0, scored: 0, possible: 0 });
    assert.equal(empty.percentage, null);
    assert.equal(empty.grade, null);
  });
});

describe("legacy sessions (scores stored on the old rubric scale)", () => {
  function completedSession(scores: (number | null)[]): SessionRow {
    return {
      id: "s",
      userId: "u",
      track: "frontend",
      level: "junior",
      tags: [],
      roleFocus: "fullstack",
      interviewType: "coding",
      duration: 60,
      difficulty: "easy",
      companyStyle: "startup",
      questionCount: scores.length,
      persona: "neutral",
      interviewerId: null,
      status: "completed",
      totalScore: 100,
      report: { percentage: 250, overallScore: 100, maxPossibleScore: 40, grade: "A+" },
      createdAt: new Date(),
      updatedAt: new Date(),
      questions: scores.map((score, i) =>
        sessionQuestion({
          id: `00000000-0000-4000-8000-00000000000${i}`,
          orderIndex: i,
          userAnswer: score === null ? null : "1",
          score,
        }),
      ),
    };
  }

  test("per-question scores are capped at maxScore", () => {
    const client = toClientSessionQuestion(sessionQuestion({ userAnswer: "1", score: 100 }));
    assert.equal(client.score, 10);
  });

  test("the report is rebuilt from the answered rows", () => {
    const client = toClientSession(completedSession([100, 0, 0, 0, null]));
    const report = client.report as unknown as {
      percentage: number;
      overallScore: number;
      answeredCount: number;
      questionBreakdown: { score: number; maxScore: number }[];
    };
    assert.equal(report.percentage, 25);
    assert.equal(report.overallScore, 10);
    assert.equal(report.answeredCount, 4);
    assert.ok(report.questionBreakdown.every((b) => b.score <= b.maxScore));
    assert.equal(client.totalScore, 10);
  });

  test("current reports are returned as stored", () => {
    const session = { ...completedSession([10, 0]), report: { percentage: 50 }, totalScore: 10 };
    const client = toClientSession(session);
    assert.deepEqual(client.report, { percentage: 50 });
    assert.equal(client.totalScore, 10);
  });
});

describe("parseRubricCriteria", () => {
  test("keeps well-formed criteria only", () => {
    assert.deepEqual(
      parseRubricCriteria({
        criteria: [
          { name: "ok", weight: 2, keywords: ["a", 1] },
          { name: "bad weight", weight: "2" },
          null,
        ],
      }),
      [{ name: "ok", weight: 2, keywords: ["a"] }],
    );
    assert.deepEqual(parseRubricCriteria(null), []);
    assert.deepEqual(parseRubricCriteria([]), []);
  });
});
