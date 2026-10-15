import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { PrismaClient } from "@prisma/client";
import { DIFFICULTY_RANGES } from "../../../common/constants";
import { isKnownTag, normalizeTag } from "../../../common/tech-tags";
import { LEVELS, TRACKS } from "../interview-options";
import { REFERENCE_QUESTIONS, type BankQuestion } from "./index";
import {
  ARCHIVED_LEVEL,
  needsWrite,
  storedOptionOrder,
  storedOptions,
  syncQuestionBank,
  toStoredFields,
  validateQuestionBank,
} from "./sync";

/** Free users only ever get bank questions: every session setting needs a usable pool. */
const MIN_QUESTIONS_PER_BAND = 8;
/** No answer position (A, B, ...) may hold more than this share of the correct answers. */
const MAX_POSITION_SHARE = 0.4;

const BANK = REFERENCE_QUESTIONS;
const SELECT_ALL = /select all that apply/i;

describe("reference question bank", () => {
  test("passes the sync's validation (schema, catalog tags, answer keys, follow-ups)", () => {
    assert.ok(BANK.length > 0);
    assert.doesNotThrow(() => validateQuestionBank(BANK));
  });

  test("ids are unique", () => {
    const seen = new Set<string>();
    const duplicates = BANK.filter((q) => seen.size === seen.add(q.id).size).map((q) => q.id);
    assert.deepEqual(duplicates, []);
  });

  test("prompts are unique (ignoring case and whitespace)", () => {
    const owner = new Map<string, string>();
    const duplicates: string[] = [];
    for (const q of BANK) {
      const key = q.prompt.toLowerCase().replace(/\s+/g, " ").trim();
      const first = owner.get(key);
      if (first) duplicates.push(`${q.id} repeats ${first}`);
      else owner.set(key, q.id);
    }
    assert.deepEqual(duplicates, []);
  });

  test("tags are canonical catalog ids", () => {
    const bad = BANK.flatMap((q) =>
      q.tags.filter((t) => !isKnownTag(t) || normalizeTag(t) !== t).map((t) => `${q.id}: ${t}`),
    );
    assert.deepEqual(bad, []);
    assert.deepEqual(BANK.filter((q) => q.tags.length === 0).map((q) => q.id), []);
  });

  test("multi-select flag, answer keys and prompt wording agree", () => {
    const bad: string[] = [];
    for (const q of BANK) {
      if (q.multiSelect) {
        const indices = q.correctOptionIndices ?? [];
        if (indices.length < 2) bad.push(`${q.id}: fewer than 2 correct options`);
        if (indices.length >= q.options.length) bad.push(`${q.id}: every option is correct`);
        if (new Set(indices).size !== indices.length) bad.push(`${q.id}: repeated index`);
        if (!indices.includes(q.correctOptionIndex)) bad.push(`${q.id}: correctOptionIndex not listed`);
        if (!SELECT_ALL.test(q.prompt)) bad.push(`${q.id}: prompt does not say "Select all that apply"`);
      } else {
        if (q.correctOptionIndices !== undefined) bad.push(`${q.id}: correctOptionIndices on a single answer`);
        if (SELECT_ALL.test(q.prompt)) bad.push(`${q.id}: "Select all that apply" on a single answer`);
      }
    }
    assert.deepEqual(bad, []);
  });

  test(`every track × level × difficulty band has at least ${MIN_QUESTIONS_PER_BAND} questions`, () => {
    const short: string[] = [];
    for (const track of TRACKS) {
      for (const level of LEVELS) {
        for (const [band, range] of Object.entries(DIFFICULTY_RANGES)) {
          const count = BANK.filter(
            (q) =>
              q.track === track &&
              q.level === level &&
              q.difficulty >= range.gte &&
              q.difficulty <= range.lte,
          ).length;
          if (count < MIN_QUESTIONS_PER_BAND) short.push(`${track}/${level}/${band}: ${count}`);
        }
      }
    }
    assert.deepEqual(short, []);
  });

  test("correct answers are spread over the stored option positions", () => {
    const groups = new Map<string, BankQuestion[]>([["whole bank", [...BANK]]]);
    for (const q of BANK) {
      const key = `${q.track}/${q.level}`;
      groups.set(key, [...(groups.get(key) ?? []), q]);
    }
    const skewed: string[] = [];
    for (const [group, questions] of groups) {
      const counts = new Map<number, number>();
      for (const q of questions) {
        const position = storedOptions(q).correctOptionIndex;
        counts.set(position, (counts.get(position) ?? 0) + 1);
      }
      for (const [position, count] of counts) {
        const share = count / questions.length;
        if (share > MAX_POSITION_SHARE) {
          skewed.push(`${group}: ${"ABCDEF"[position]} is correct in ${Math.round(share * 100)}%`);
        }
      }
    }
    assert.deepEqual(skewed, []);
  });
});

describe("stored option order", () => {
  test("is a fixed permutation per id that keeps every answer", () => {
    for (const q of BANK) {
      const order = storedOptionOrder(q.id, q.options.length);
      assert.deepEqual(storedOptionOrder(q.id, q.options.length), order, q.id);
      assert.deepEqual([...order].sort(), q.options.map((_, i) => i), q.id);

      const stored = storedOptions(q);
      assert.deepEqual([...stored.options].sort(), [...q.options].sort(), q.id);
      assert.equal(stored.options[stored.correctOptionIndex], q.options[q.correctOptionIndex], q.id);
      const authoredCorrect = q.multiSelect ? q.correctOptionIndices! : [q.correctOptionIndex];
      assert.deepEqual(
        stored.correctOptionIndices.map((i) => stored.options[i]).sort(),
        authoredCorrect.map((i) => q.options[i]).sort(),
        q.id,
      );
    }
  });

  test("never changes for existing questions (answered sessions depend on it)", () => {
    // A change to the salt or the algorithm would reorder the options of answered questions.
    assert.deepEqual(storedOptionOrder("iq-fe-react-jr-1-v2", 4), [3, 1, 0, 2]);
    assert.deepEqual(storedOptionOrder("iq-fe-react-mid-ms-1-v2", 6), [4, 5, 3, 0, 1, 2]);
    assert.deepEqual(storedOptionOrder("iq-do-tracing-sr-1", 4), [0, 1, 3, 2]);
  });
});

describe("validateQuestionBank", () => {
  const good = BANK.find((q) => !q.multiSelect && q.followUpIds.length === 0)!;

  test("rejects bad data, naming every problem", () => {
    const bad: BankQuestion[] = [
      { ...good, id: "bad-1", tags: ["Not A Tag"], correctOptionIndex: 9 },
      { ...good, id: "bad-2", multiSelect: true, correctOptionIndices: [0] },
      { ...good, id: "bad-3", followUpIds: ["missing-id"] },
      { ...good, id: "bad-3" },
    ];
    assert.throws(
      () => validateQuestionBank(bad),
      (error: Error) =>
        /bad-1: .*not a catalog id.*correctOptionIndex out of range/.test(error.message) &&
        /bad-2: multi-select questions need 2\+/.test(error.message) &&
        /bad-3: follow-up "missing-id"/.test(error.message) &&
        /bad-3: duplicate id/.test(error.message),
    );
  });

  test("accepts a valid bank", () => {
    assert.doesNotThrow(() => validateQuestionBank([good]));
  });
});

describe("needsWrite", () => {
  const q = BANK.find((item) => item.multiSelect)!;

  test("a row already holding the stored fields needs no write, whatever its jsonb key order", () => {
    const fields = toStoredFields(q);
    const row: Record<string, unknown> = {
      id: q.id,
      ...structuredClone(fields),
      rubric: { criteria: fields.rubric.criteria.map(({ weight, keywords, name }) => ({ weight, keywords, name })) },
    };
    assert.equal(needsWrite(row, fields), false);
  });

  test("a missing row or any changed column needs a write", () => {
    const fields = toStoredFields(q);
    assert.equal(needsWrite(undefined, fields), true);
    assert.equal(needsWrite({ ...structuredClone(fields), prompt: "old" }, fields), true);
    assert.equal(needsWrite({ ...structuredClone(fields), options: [...fields.options].reverse() }, fields), true);
    assert.equal(needsWrite({ ...structuredClone(fields), level: ARCHIVED_LEVEL }, fields), true);
  });
});

type Row = Record<string, any> & { id: string };

/** In-memory stand-in for the InterviewQuestion queries the sync makes. */
function fakePrisma(initial: Row[], usedIds: ReadonlySet<string>) {
  const table = new Map(initial.map((row) => [row.id, structuredClone(row)]));
  let writes = 0;
  const matches = (row: Row, where: any): boolean =>
    (where.id === undefined ||
      (typeof where.id === "string"
        ? row.id === where.id
        : (!where.id.in || where.id.in.includes(row.id)) &&
          (!where.id.notIn || !where.id.notIn.includes(row.id)))) &&
    (where.source === undefined || row.source === where.source) &&
    (where.level?.not === undefined || row.level !== where.level.not) &&
    (where.sessionQuestions?.none === undefined || !usedIds.has(row.id));
  // jsonb sorts object keys; the sync must not see that as a change.
  const asJsonb = (value: unknown): unknown =>
    JSON.parse(JSON.stringify(value, (_key, v) =>
      v && typeof v === "object" && !Array.isArray(v)
        ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
        : v,
    ));
  const store = (data: Row) => ({ ...data, rubric: asJsonb(data.rubric), options: asJsonb(data.options) });
  const client = {
    interviewQuestion: {
      findMany: async ({ where, select }: any) =>
        [...table.values()]
          .filter((row) => matches(row, where))
          .map((row) => structuredClone(Object.fromEntries(Object.keys(select).map((k) => [k, row[k]])))),
      upsert: async ({ where, create, update }: any) => {
        writes++;
        const row = table.get(where.id);
        table.set(where.id, row ? { ...row, ...store(structuredClone(update)) } : store(structuredClone(create)));
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const row of table.values()) {
          if (matches(row, where)) {
            Object.assign(row, structuredClone(data));
            count++;
          }
        }
        writes += count;
        return { count };
      },
      deleteMany: async ({ where }: any) => {
        let count = 0;
        for (const [id, row] of table) {
          if (matches(row, where)) {
            table.delete(id);
            count++;
          }
        }
        writes += count;
        return { count };
      },
    },
    $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
  };
  return { prisma: client as unknown as PrismaClient, table, writes: () => writes };
}

describe("syncQuestionBank", () => {
  const bank = BANK.filter((q) => q.followUpIds.length === 0).slice(0, 3);
  const aiRow = (id: string, tags: string[]): Row => ({
    id,
    source: "ai-generated",
    level: "junior",
    tags,
    followUpIds: [],
  });
  const initial: Row[] = [
    { ...toStoredFields(bank[0]), id: bank[0].id, prompt: "an older wording" },
    { id: "old-used", source: "seed", level: "mid", tags: ["react"], followUpIds: ["old-unused"] },
    { id: "old-unused", source: "seed", level: "mid", tags: ["react"], followUpIds: [] },
    { id: "old-archived", source: "seed", level: ARCHIVED_LEVEL, tags: [], followUpIds: [] },
    aiRow("ai-clean", ["react"]),
    aiRow("ai-mixed", ["React", "made-up"]),
    aiRow("ai-off-used", ["made-up"]),
    aiRow("ai-off-unused", ["made-up"]),
  ];
  const used = new Set(["old-used", "ai-off-used"]);

  test("upserts the bank, retires old rows, tidies AI tags, then a re-run changes nothing", async () => {
    const { prisma, table, writes } = fakePrisma(initial, used);
    const lines: string[] = [];

    const first = await syncQuestionBank(prisma, (line) => lines.push(line), bank);
    assert.deepEqual(first, {
      questions: 3,
      created: 2,
      updated: 1,
      unchanged: 0,
      archived: 1,
      removed: 1,
      aiRetagged: 1,
      aiRemoved: 1,
      aiArchived: 1,
    });
    assert.equal(lines.length, 1);
    assert.ok(!lines[0].includes("\n"));
    assert.equal(table.get(bank[0].id)?.prompt, bank[0].prompt);
    assert.deepEqual(
      { level: table.get("old-used")?.level, followUpIds: table.get("old-used")?.followUpIds },
      { level: ARCHIVED_LEVEL, followUpIds: [] },
    );
    assert.equal(table.has("old-unused"), false);
    assert.equal(table.get("old-archived")?.level, ARCHIVED_LEVEL);
    assert.deepEqual(table.get("ai-clean")?.tags, ["react"]);
    assert.deepEqual(table.get("ai-mixed")?.tags, ["react"]);
    assert.deepEqual(
      { level: table.get("ai-off-used")?.level, tags: table.get("ai-off-used")?.tags },
      { level: ARCHIVED_LEVEL, tags: [] },
    );
    assert.equal(table.has("ai-off-unused"), false);

    const writesAfterFirst = writes();
    const second = await syncQuestionBank(prisma, () => undefined, bank);
    assert.deepEqual(second, {
      questions: 3,
      created: 0,
      updated: 0,
      unchanged: 3,
      archived: 0,
      removed: 0,
      aiRetagged: 0,
      aiRemoved: 0,
      aiArchived: 0,
    });
    assert.equal(writes(), writesAfterFirst);
  });

  test("bad data is rejected before anything is written", async () => {
    const { prisma, writes } = fakePrisma(initial, used);
    await assert.rejects(
      syncQuestionBank(prisma, () => undefined, [{ ...bank[0], tags: ["Not A Tag"] }]),
      /not a catalog id/,
    );
    assert.equal(writes(), 0);
  });
});
