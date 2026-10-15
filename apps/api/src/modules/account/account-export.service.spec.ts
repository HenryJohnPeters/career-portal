import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { NotFoundException } from "@nestjs/common";
import {
  AccountExportService,
  EXPORT_PAGE_SIZE,
  jsonObjectChunks,
  pageWhere,
  paginate,
} from "./account-export.service";

async function collect(chunks: AsyncIterable<string>): Promise<string> {
  let out = "";
  for await (const chunk of chunks) out += chunk;
  return out;
}

async function* rowsOf<T>(rows: T[]): AsyncGenerator<T> {
  for (const row of rows) yield row;
}

/** `count` rows of one user, in (createdAt, id) order. */
function rowsFor(prefix: string, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${String(i).padStart(3, "0")}`,
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, Math.floor(i / 2))),
  }));
}

/** Serves `rows` the way the keyset `where` asks for them. */
function keysetPage(rows: { id: string; createdAt: Date }[], calls: unknown[]) {
  return async (args: any) => {
    calls.push(args.where);
    const or = args.where.OR as
      | [{ createdAt: { gt: Date } }, { createdAt: Date; id: { gt: string } }]
      | undefined;
    const after = or
      ? rows.filter(
          (r) =>
            r.createdAt > or[0].createdAt.gt ||
            (r.createdAt.getTime() === or[1].createdAt.getTime() && r.id > or[1].id.gt),
        )
      : rows;
    return after.slice(0, args.take);
  };
}

describe("jsonObjectChunks", () => {
  test("streams the same JSON as JSON.stringify(value, null, 2)", async () => {
    const value = {
      format: "career-portal-export",
      version: 1,
      profile: { name: "Jane", when: new Date("2026-01-02T03:04:05.000Z") },
      empty: [],
      rows: [{ a: 1, nested: { b: [1, 2] } }, { a: 2, text: "line\nbreak  " }],
      none: null,
    };
    const out = await collect(
      jsonObjectChunks([
        ["format", value.format],
        ["version", value.version],
        ["profile", value.profile],
        ["empty", rowsOf([])],
        ["rows", rowsOf(value.rows)],
        ["none", value.none],
      ]),
    );
    assert.equal(out, `${JSON.stringify(value, null, 2)}\n`);
    assert.deepEqual(JSON.parse(out), JSON.parse(JSON.stringify(value)));
  });
});

describe("paginate", () => {
  test("reads every row across pages, including rows sharing a timestamp", async () => {
    const rows = rowsFor("r", 12);
    const calls: unknown[] = [];
    const page = keysetPage(rows, calls);
    const seen: string[] = [];
    for await (const row of paginate(5, (after) => page({ where: pageWhere("u1", after), take: 5 }))) {
      seen.push(row.id);
    }
    assert.deepEqual(seen, rows.map((r) => r.id));
    assert.equal(calls.length, 3);
  });

  test("an exact multiple of the page size ends with one empty page", async () => {
    const rows = rowsFor("r", 10);
    const calls: unknown[] = [];
    const page = keysetPage(rows, calls);
    let count = 0;
    for await (const _row of paginate(5, (after) => page({ where: pageWhere("u1", after), take: 5 }))) {
      count++;
    }
    assert.equal(count, 10);
    assert.equal(calls.length, 3);
  });
});

describe("AccountExportService.openExport", () => {
  function setup(user: unknown) {
    const versions = rowsFor("cv", EXPORT_PAGE_SIZE.cvVersions * 2 + 1).map((r) => ({
      ...r,
      title: r.id,
      sections: [],
    }));
    const answers = rowsFor("qa", 2).map((r) => ({ ...r, questionId: "q", skipped: false }));
    const versionCalls: unknown[] = [];
    const empty = { findMany: async () => [] };
    const prisma: any = {
      user: { findUnique: async () => user },
      $queryRaw: async () => [{ month: "2026-01", action: "cv", status: "succeeded", count: 2 }],
      auditLog: { findMany: async () => [{ action: "account.created", reason: null }] },
      cvVersion: { findMany: keysetPage(versions, versionCalls) },
      coverLetter: empty,
      job: empty,
      interviewSession: {
        findMany: async (args: any) =>
          args.where.OR
            ? []
            : [
                {
                  id: "s1",
                  createdAt: new Date(0),
                  questions: [{ orderIndex: 0, question: { prompt: "Why?", type: "theory" } }],
                },
              ],
      },
      technicalTest: empty,
      questionAnswer: { findMany: keysetPage(answers, []) },
    };
    return { service: new AccountExportService(prisma), versions, versionCalls };
  }

  test("a missing account is a 404 before anything is streamed", async () => {
    const { service } = setup(null);
    await assert.rejects(service.openExport("u1"), NotFoundException);
  });

  test("streams every collection in pages and parses as one JSON document", async () => {
    const { service, versions, versionCalls } = setup({
      id: "u1",
      email: "jane@example.com",
      name: "Jane",
      isPremium: false,
      subscriptionStatus: null,
      stripeCurrentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEnd: null,
      trialUsedAt: null,
    });
    const now = new Date("2026-10-15T00:00:00.000Z");
    const data = JSON.parse(await collect(await service.openExport("u1", now)));

    assert.equal(data.exportedAt, now.toISOString());
    assert.deepEqual(data.profile, { id: "u1", email: "jane@example.com", name: "Jane" });
    assert.equal(data.subscription.plan, "free");
    assert.deepEqual(
      data.cvVersions.map((v: { id: string }) => v.id),
      versions.map((v) => v.id),
    );
    assert.equal(versionCalls.length, 3);
    assert.deepEqual(data.interviewSessions[0].questions, [
      { orderIndex: 0, prompt: "Why?", type: "theory" },
    ]);
    // The paging id is not part of a legacy answer row.
    assert.equal(data.legacyQuestionAnswers.length, 2);
    assert.equal("id" in data.legacyQuestionAnswers[0], false);
    assert.deepEqual(data.coverLetters, []);
    assert.equal(data.aiUsage[0].count, 2);
    assert.deepEqual(Object.keys(data), [
      "format",
      "version",
      "exportedAt",
      "profile",
      "subscription",
      "cvVersions",
      "coverLetters",
      "jobs",
      "interviewSessions",
      "technicalTests",
      "aiUsage",
      "legacyQuestionAnswers",
      "accountEvents",
    ]);
  });
});
