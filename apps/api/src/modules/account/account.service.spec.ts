import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { UpdateProfileDto } from "./account.dto";
import { AccountService, DELETED_USER_MARKER } from "./account.service";

function setup(options: {
  user?: { email: string; supabaseId: string | null } | null;
  billingError?: Error;
  dbError?: Error;
  /** What a follow-up existence check sees after a failed delete. */
  userStillExists?: boolean;
  supabaseResult?: "deleted" | "not_configured" | { failed: string };
} = {}) {
  const steps: string[] = [];
  const transactionOps: unknown[] = [];
  const op = (name: string, args: unknown) => ({ op: name, args });

  const prisma = {
    user: {
      findUnique: async () =>
        options.user === undefined
          ? { email: "Jane@Example.com", supabaseId: "sb-1" }
          : options.user,
      delete: (args: unknown) => op("user.delete", args),
      count: async () => (options.userStillExists === false ? 0 : 1),
    },
    questionGenerationLog: {
      updateMany: (args: unknown) => op("questionGenerationLog.updateMany", args),
    },
    practiceQuestionUsage: {
      deleteMany: (args: unknown) => op("practiceQuestionUsage.deleteMany", args),
    },
    auditLog: { create: (args: unknown) => op("auditLog.create", args) },
    $transaction: async (ops: unknown[]) => {
      steps.push("db");
      if (options.dbError) throw options.dbError;
      transactionOps.push(...ops);
      return ops;
    },
  };
  const billing = {
    cancelSubscriptionsForAccountDeletion: async (userId: string) => {
      steps.push(`billing:${userId}`);
      if (options.billingError) throw options.billingError;
    },
  };
  const auth = {
    forgetIdentity: (supabaseId: string) => steps.push(`forget:${supabaseId}`),
    restoreIdentity: (supabaseId: string) => steps.push(`restore:${supabaseId}`),
  };
  const supabaseAdmin = {
    deleteAuthUser: async (supabaseId: string) => {
      steps.push(`supabase:${supabaseId}`);
      return options.supabaseResult ?? "deleted";
    },
  };
  const service = new AccountService(
    prisma as never,
    auth as never,
    billing as never,
    supabaseAdmin as never,
  );
  return { service, steps, transactionOps };
}

describe("AccountService.deleteAccount", () => {
  test("cancels billing, revokes tokens, deletes the data, then the auth identity (in that order)", async () => {
    const { service, steps, transactionOps } = setup();
    const res = await service.deleteAccount("u1", "  jane@example.COM ");
    assert.deepEqual(res, { deleted: true });
    assert.deepEqual(steps, ["billing:u1", "forget:sb-1", "db", "supabase:sb-1"]);
    assert.deepEqual(
      transactionOps.map((o) => (o as { op: string }).op),
      [
        "questionGenerationLog.updateMany",
        "practiceQuestionUsage.deleteMany",
        "user.delete",
        "auditLog.create",
      ],
    );
    const anonymised = transactionOps[0] as { args: { where: unknown; data: unknown } };
    assert.deepEqual(anonymised.args.where, { triggeredBy: "u1" });
    assert.deepEqual(anonymised.args.data, { triggeredBy: DELETED_USER_MARKER });
    const audit = transactionOps[3] as { args: { data: Record<string, unknown> } };
    assert.equal(audit.args.data.userId, undefined, "the audit row carries no user link");
  });

  test("a mismatched confirmation email is a 400 and touches nothing", async () => {
    const { service, steps } = setup();
    await assert.rejects(
      () => service.deleteAccount("u1", "someone@else.com"),
      (err: unknown) => err instanceof BadRequestException,
    );
    assert.deepEqual(steps, []);
  });

  test("a Stripe failure aborts before any data is deleted", async () => {
    const { service, steps } = setup({
      billingError: new ServiceUnavailableException("Billing is temporarily unavailable."),
    });
    await assert.rejects(
      () => service.deleteAccount("u1", "jane@example.com"),
      (err: unknown) => err instanceof ServiceUnavailableException,
    );
    assert.deepEqual(steps, ["billing:u1"]);
  });

  test("a failed delete lets the user's tokens work again", async () => {
    const dbError = new Error("connection lost");
    const { service, steps } = setup({ dbError });
    await assert.rejects(() => service.deleteAccount("u1", "jane@example.com"), dbError);
    assert.deepEqual(steps, ["billing:u1", "forget:sb-1", "db", "restore:sb-1"]);
  });

  test("a failed delete of a row that is already gone (concurrent deletion) keeps tokens refused", async () => {
    const dbError = new Error("Record to delete does not exist");
    const { service, steps } = setup({ dbError, userStillExists: false });
    await assert.rejects(() => service.deleteAccount("u1", "jane@example.com"), dbError);
    assert.deepEqual(steps, ["billing:u1", "forget:sb-1", "db"]);
  });

  test("a Supabase failure after the data is gone still reports success", async () => {
    const { service, steps } = setup({ supabaseResult: { failed: "HTTP 500" } });
    assert.deepEqual(await service.deleteAccount("u1", "jane@example.com"), { deleted: true });
    assert.deepEqual(steps.at(-1), "supabase:sb-1");
  });

  test("accounts without a Supabase identity skip the auth deletion", async () => {
    const { service, steps } = setup({ user: { email: "a@b.co", supabaseId: null } });
    await service.deleteAccount("u1", "a@b.co");
    assert.deepEqual(steps, ["billing:u1", "db"]);
  });
});

describe("UpdateProfileDto", () => {
  async function errorsFor(name: unknown) {
    const dto = plainToInstance(UpdateProfileDto, { name });
    return { dto, errors: await validate(dto) };
  }

  test("trims and collapses whitespace", async () => {
    const { dto, errors } = await errorsFor("  Jane \n  Doe ");
    assert.equal(errors.length, 0);
    assert.equal(dto.name, "Jane Doe");
  });

  test("rejects empty, too long, control characters and non-strings", async () => {
    for (const bad of ["   ", "x".repeat(81), "Jane\u0000Doe", 42]) {
      assert.ok((await errorsFor(bad)).errors.length > 0, JSON.stringify(bad));
    }
  });

  test("accepts 80 characters", async () => {
    assert.equal((await errorsFor("y".repeat(80))).errors.length, 0);
  });
});
