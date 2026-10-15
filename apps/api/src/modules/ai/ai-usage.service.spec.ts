import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { Logger } from "@nestjs/common";
import { FREE_TIER } from "../../common/constants";
import { QuotaExceededException } from "../../common/errors";
import { limitsFor, modelTierFor } from "../../common/plan";
import type { PrismaService } from "../../common/prisma.service";
import type { EntitlementsService } from "../entitlements/entitlements.service";
import type { AiModelConfig } from "./ai-models";
import { AiUsageService } from "./ai-usage.service";

Logger.overrideLogger(false);

interface Row {
  id: string;
  userId: string;
  action: string;
  model: string | null;
  status: string;
  createdAt: Date;
  promptTokens?: number;
  completionTokens?: number;
}

type IdFilter = string | { in: string[] };

/** Just enough of Prisma for AiUsageService, in memory. */
class FakeDb {
  rows: Row[] = [];
  locks: string[] = [];
  failUpdates = false;

  aiUsage = {
    findMany: async ({ where }: { where: { userId: string; createdAt: { gte: Date } } }) =>
      this.rows
        .filter((r) => r.userId === where.userId && r.createdAt >= where.createdAt.gte)
        .map(({ status, createdAt }) => ({ status, createdAt })),
    createMany: async ({ data }: { data: Omit<Row, "createdAt">[] }) => {
      for (const row of data) this.rows.push({ ...row, createdAt: new Date() });
      return { count: data.length };
    },
    updateMany: async ({
      where,
      data,
    }: {
      where: { id: IdFilter; status: string };
      data: Partial<Row>;
    }) => {
      if (this.failUpdates) throw Object.assign(new Error("db down"), { code: "P1001" });
      const ids = typeof where.id === "string" ? [where.id] : where.id.in;
      let count = 0;
      for (const row of this.rows) {
        if (!ids.includes(row.id) || row.status !== where.status) continue;
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined) (row as unknown as Record<string, unknown>)[key] = value;
        }
        count++;
      }
      return { count };
    },
  };

  $executeRaw = async (_strings: TemplateStringsArray, key: string) => {
    this.locks.push(key);
    return 1;
  };

  $transaction = async (arg: unknown) =>
    typeof arg === "function" ? (arg as (tx: this) => unknown)(this) : Promise.all(arg as Promise<unknown>[]);
}

function setup(isPremium = false) {
  const db = new FakeDb();
  const entitlements = {
    getPlan: async (userId: string) => ({
      userId,
      plan: isPremium ? "premium" : "free",
      isPremium,
      isTrialing: false,
      limits: limitsFor(isPremium),
      modelTier: modelTierFor(isPremium),
    }),
  } as unknown as EntitlementsService;
  const models = {
    modelFor: (tier: string) => (tier === "standard" ? "std-model" : "light-model"),
  } as unknown as AiModelConfig;
  const service = new AiUsageService(db as unknown as PrismaService, entitlements, models);
  return { db, service };
}

const USER = "11111111-1111-4111-8111-111111111111";

describe("AiUsageService.withReservation", () => {
  test("marks the reservation succeeded with model and token counts", async () => {
    const { db, service } = setup();
    const result = await service.withReservation(USER, "cv-section", async (ctx) => {
      assert.equal(ctx.model, "light-model");
      assert.equal(ctx.isPremium, false);
      assert.equal(db.rows[0].status, "pending");
      ctx.recordTokens({ promptTokens: 100, completionTokens: 20 });
      ctx.recordTokens({ promptTokens: 1, completionTokens: 2 });
      return "done";
    });
    assert.equal(result, "done");
    assert.equal(db.rows.length, 1);
    assert.deepEqual(
      { status: db.rows[0].status, model: db.rows[0].model, p: db.rows[0].promptTokens, c: db.rows[0].completionTokens },
      { status: "succeeded", model: "light-model", p: 101, c: 22 },
    );
    assert.deepEqual(db.locks, [`ai:${USER}`]);
  });

  test("keeps a failed attempt as a failed row (never deleted) and rethrows", async () => {
    const { db, service } = setup();
    await assert.rejects(
      service.withReservation(USER, "cv-full", async (ctx) => {
        ctx.recordTokens({ promptTokens: 50, completionTokens: 4_000 });
        throw new Error("model output invalid");
      }),
      /model output invalid/,
    );
    assert.equal(db.rows.length, 1);
    assert.equal(db.rows[0].status, "failed");
    assert.equal(db.rows[0].completionTokens, 4_000);
  });

  test("refuses at the free quota without inserting a row", async () => {
    const { db, service } = setup();
    for (let i = 0; i < FREE_TIER.monthlyAiActions; i++) {
      db.rows.push({
        id: `r${i}`,
        userId: USER,
        action: "cv-section",
        model: "light-model",
        status: "succeeded",
        createdAt: new Date(),
      });
    }
    let ran = false;
    await assert.rejects(
      service.withReservation(USER, "cv-section", async () => {
        ran = true;
      }),
      (error) => error instanceof QuotaExceededException,
    );
    assert.equal(ran, false);
    assert.equal(db.rows.length, FREE_TIER.monthlyAiActions);
  });

  test("failed rows do not use up the free quota", async () => {
    const { db, service } = setup();
    for (let i = 0; i < FREE_TIER.monthlyAiActions; i++) {
      db.rows.push({
        id: `f${i}`,
        userId: USER,
        action: "cv-section",
        model: null,
        status: "failed",
        createdAt: new Date(),
      });
    }
    assert.equal(await service.withReservation(USER, "cv-section", async () => "ok"), "ok");
  });

  test("multi-unit reservations insert one row per unit; tokens go on the first", async () => {
    const { db, service } = setup(true);
    await service.withReservation(
      USER,
      "tailor-application",
      async (ctx) => {
        assert.equal(ctx.model, "std-model");
        assert.equal(db.rows.length, 2);
        ctx.recordTokens({ promptTokens: 10, completionTokens: 10 });
      },
      { units: 2 },
    );
    assert.deepEqual(
      db.rows.map((r) => [r.status, r.promptTokens ?? null]),
      [
        ["succeeded", 10],
        ["succeeded", null],
      ],
    );
  });

  test("a failure to record the outcome does not lose the result", async () => {
    const { db, service } = setup();
    db.failUpdates = true;
    assert.equal(await service.withReservation(USER, "cv-section", async () => 42), 42);
    assert.equal(db.rows[0].status, "pending");
  });
});

describe("AiUsageService.precheck", () => {
  test("passes with room and throws the quota error when exhausted, without writing", async () => {
    const { db, service } = setup();
    await service.precheck(USER);
    for (let i = 0; i < FREE_TIER.monthlyAiActions; i++) {
      db.rows.push({
        id: `r${i}`,
        userId: USER,
        action: "x",
        model: null,
        status: "succeeded",
        createdAt: new Date(),
      });
    }
    await assert.rejects(service.precheck(USER), (error) => error instanceof QuotaExceededException);
    assert.deepEqual(db.locks, []);
  });
});
