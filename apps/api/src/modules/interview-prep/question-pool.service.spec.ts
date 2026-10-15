import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { QuestionPoolService, type PoolRequest } from "./question-pool.service";

const BANK = [
  { id: "q-react-1", type: "theory", difficulty: 2, tags: ["react"] },
  { id: "q-react-2", type: "theory", difficulty: 2, tags: ["react", "hooks"] },
  { id: "q-css-1", type: "theory", difficulty: 2, tags: ["css"] },
  { id: "q-js-1", type: "coding", difficulty: 2, tags: ["javascript"] },
  { id: "q-beh-1", type: "behavioral", difficulty: 1, tags: ["behavioral"] },
];

function setup(bank = BANK) {
  const prisma: any = {
    interviewQuestion: {
      findMany: async (args: any) => {
        const wanted: string[] | undefined = args.where.tags?.hasSome;
        return wanted ? bank.filter((q) => q.tags.some((t) => wanted.includes(t))) : bank;
      },
    },
    interviewSessionQuestion: { findMany: async () => [] },
  };
  const generator: any = {
    ensurePoolForUser: async () => ({ generated: 0, skipped: "pool_sufficient" }),
  };
  return new QuestionPoolService(prisma, generator);
}

const request = (tags: string[], questionCount = 4): PoolRequest => ({
  userId: "u1",
  isPremium: false,
  track: "frontend",
  level: "junior",
  difficulty: "easy",
  tags,
  questionCount,
  roleFocus: "frontend",
  interviewType: "coding",
});

describe("QuestionPoolService.pickQuestions", () => {
  test("no question with any requested tag: nothing is picked (no off-topic session)", async () => {
    const pick = await setup().pickQuestions(request(["vue"]));
    assert.deepEqual(pick, { questionIds: [], noTagMatch: true });
  });

  test("a partial tag match is topped up from the same track and level, tagged first", async () => {
    const pick = await setup().pickQuestions(request(["react"]));
    assert.equal(pick.noTagMatch, false);
    assert.equal(pick.questionIds.length, 4);
    assert.deepEqual(new Set(pick.questionIds.slice(0, 2)), new Set(["q-react-1", "q-react-2"]));
    assert.equal(new Set(pick.questionIds).size, 4);
  });

  test("no tags: the whole pool is eligible", async () => {
    const pick = await setup().pickQuestions(request([], 3));
    assert.equal(pick.noTagMatch, false);
    assert.equal(pick.questionIds.length, 3);
  });
});
