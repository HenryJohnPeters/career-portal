import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { fiftyFiftyEliminated } from "./fifty-fifty";
import { pickFollowUp, shouldFollowUp } from "./follow-up-strategy";
import { personaResponse } from "./persona-responder";
import { selectQuestions } from "./question-selector";
import type { CandidateQuestion, SelectionSettings } from "./interfaces";

describe("fiftyFiftyEliminated", () => {
  test("is deterministic for the same session question", () => {
    const first = fiftyFiftyEliminated("sq-1", 4, [2]);
    assert.deepEqual(fiftyFiftyEliminated("sq-1", 4, [2]), first);
  });

  test("never strikes out the correct option and always strikes two", () => {
    for (let i = 0; i < 50; i++) {
      for (const correct of [0, 1, 2, 3]) {
        const eliminated = fiftyFiftyEliminated(`seed-${i}`, 4, [correct]);
        assert.ok(eliminated);
        assert.equal(eliminated.length, 2);
        assert.ok(!eliminated.includes(correct));
        assert.notEqual(eliminated[0], eliminated[1]);
      }
    }
  });

  test("is skipped for small or multi-answer questions", () => {
    assert.equal(fiftyFiftyEliminated("x", 3, [0]), null);
    assert.equal(fiftyFiftyEliminated("x", 6, [0, 1, 3, 5]), null);
  });
});

describe("follow-ups", () => {
  test("only after a wrong answer to a question that declares follow-ups", () => {
    assert.equal(shouldFollowUp(false, ["a"]), true);
    assert.equal(shouldFollowUp(true, ["a"]), false);
    assert.equal(shouldFollowUp(false, []), false);
  });

  test("picks the follow-up covering most missed points, else declared order", () => {
    const candidates = [
      { id: "a", expectedPoints: ["x"] },
      { id: "b", expectedPoints: ["Missed one", "missed two"] },
    ];
    assert.equal(pickFollowUp(["a", "b"], ["missed one", "missed two"], candidates), "b");
    assert.equal(pickFollowUp(["a", "b"], [], candidates), "a");
    assert.equal(pickFollowUp(["gone", "b"], [], candidates), "b");
    assert.equal(pickFollowUp(["gone"], [], candidates), null);
  });
});

describe("personaResponse", () => {
  test("uses the persona template and the missed points", () => {
    assert.match(personaResponse("tough", false, ["closures"], "standard"), /closures/);
    assert.match(personaResponse("friendly", true, [], "standard"), /Great job/);
  });

  test("minimal advice is short; detailed adds a tip; unknown personas fall back to neutral", () => {
    assert.equal(personaResponse("tough", true, [], "minimal"), "Good answer.");
    assert.match(personaResponse("neutral", false, [], "detailed"), /recommend/);
    assert.equal(
      personaResponse("unknown", true, [], "standard"),
      personaResponse("neutral", true, [], "standard"),
    );
  });

  test("never promises a follow-up", () => {
    for (const persona of ["friendly", "neutral", "tough"]) {
      assert.doesNotMatch(personaResponse(persona, false, ["x"], "standard"), /follow-up/i);
    }
  });
});

describe("selectQuestions", () => {
  const settings: SelectionSettings = {
    level: "mid",
    difficulty: "medium",
    tags: ["react"],
    questionCount: 5,
    roleFocus: "frontend",
    interviewType: "coding",
  };

  function pool(n: number, overrides: (i: number) => Partial<CandidateQuestion> = () => ({})) {
    return Array.from({ length: n }, (_, i) => ({
      id: `q${i}`,
      type: i % 2 ? "coding" : "theory",
      difficulty: 3,
      tags: ["react"],
      ...overrides(i),
    }));
  }

  test("returns unique questions, at most the requested count", () => {
    const picked = selectQuestions(pool(20), settings, new Set());
    assert.equal(picked.length, 5);
    assert.equal(new Set(picked.map((q) => q.id)).size, 5);
    assert.equal(selectQuestions(pool(3), settings, new Set()).length, 3);
    assert.deepEqual(selectQuestions([], settings, new Set()), []);
  });

  test("strongly prefers questions the user has not seen recently", () => {
    const candidates = pool(10);
    const recent = new Set(candidates.slice(0, 5).map((q) => q.id));
    let recentPicks = 0;
    for (let run = 0; run < 100; run++) {
      recentPicks += selectQuestions(candidates, settings, recent).filter((q) => recent.has(q.id)).length;
    }
    // Without the penalty half of the picks (≈250) would be recent questions.
    assert.ok(recentPicks < 100, `recent questions picked ${recentPicks} times`);
  });

  test("keeps any one question type to at most 60% when alternatives exist", () => {
    const candidates = pool(20, (i) => ({ type: i < 15 ? "coding" : "theory" }));
    for (let run = 0; run < 20; run++) {
      const picked = selectQuestions(candidates, { ...settings, questionCount: 10 }, new Set());
      assert.ok(picked.filter((q) => q.type === "coding").length <= 6);
      assert.equal(new Set(picked.map((q) => q.id)).size, picked.length);
    }
  });

  test("is reproducible with an injected random source", () => {
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const a = selectQuestions(pool(30), settings, new Set(), random).map((q) => q.id);
    seed = 1;
    const b = selectQuestions(pool(30), settings, new Set(), random).map((q) => q.id);
    assert.deepEqual(a, b);
  });
});
