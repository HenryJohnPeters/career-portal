import { strict as assert } from "node:assert";
import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";

type UserRow = {
  id: string;
  supabaseId: string | null;
  email: string;
  name: string;
};

type Counts = {
  cvVersions: number;
  coverLetters: number;
  jobs: number;
  sessions: number;
  tests: number;
  aiUsages: number;
};

function createAuthService(params: {
  userBySupabaseId?: UserRow | null;
  userByEmail?: UserRow | null;
  counts?: Partial<Counts>;
}) {
  const counts: Counts = {
    cvVersions: 0,
    coverLetters: 0,
    jobs: 0,
    sessions: 0,
    tests: 0,
    aiUsages: 0,
    ...params.counts,
  };

  const prisma = {
    user: {
      findUnique: async ({
        where,
      }: {
        where: { supabaseId?: string; email?: string };
      }) => {
        if (where.supabaseId !== undefined)
          return params.userBySupabaseId ?? null;
        if (where.email !== undefined) return params.userByEmail ?? null;
        return null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { supabaseId: string };
      }) => ({
        ...(params.userByEmail as UserRow),
        id: where.id,
        supabaseId: data.supabaseId,
      }),
      create: async ({
        data,
      }: {
        data: { supabaseId: string; email: string; name: string };
      }) => ({
        id: "new-user",
        supabaseId: data.supabaseId,
        email: data.email,
        name: data.name,
      }),
    },
    cvVersion: { count: async () => counts.cvVersions },
    coverLetter: { count: async () => counts.coverLetters },
    job: { count: async () => counts.jobs },
    interviewSession: { count: async () => counts.sessions },
    technicalTest: { count: async () => counts.tests },
    aiUsage: { count: async () => counts.aiUsages },
  };

  const config = {
    get: (key: string): string | undefined => {
      if (key === "SUPABASE_URL") return "https://example.supabase.co";
      if (key === "SUPABASE_JWT_SECRET") return "secret";
      return undefined;
    },
  };

  return new AuthService(prisma as never, config as never);
}

type TestCase = { name: string; run: () => Promise<void> | void };

const tests: TestCase[] = [
  {
    name: "returns existing user when supabaseId already linked",
    run: async () => {
      const existing = {
        id: "u1",
        supabaseId: "sb-1",
        email: "user@example.com",
        name: "User",
      };
      const service = createAuthService({ userBySupabaseId: existing });
      const user = await service.findOrCreateUser("sb-1", "user@example.com");
      assert.equal(user.id, "u1");
      assert.equal(user.supabaseId, "sb-1");
    },
  },
  {
    name: "links legacy email account with no existing activity",
    run: async () => {
      const legacy = {
        id: "legacy-1",
        supabaseId: null,
        email: "legacy@example.com",
        name: "Legacy",
      };
      const service = createAuthService({
        userBySupabaseId: null,
        userByEmail: legacy,
        counts: {
          cvVersions: 0,
          coverLetters: 0,
          jobs: 0,
          sessions: 0,
          tests: 0,
          aiUsages: 0,
        },
      });

      const user = await service.findOrCreateUser(
        "sb-legacy",
        "legacy@example.com",
      );
      assert.equal(user.id, "legacy-1");
      assert.equal(user.supabaseId, "sb-legacy");
    },
  },
  {
    name: "blocks auto-linking legacy email account with existing activity",
    run: async () => {
      const legacy = {
        id: "legacy-2",
        supabaseId: null,
        email: "legacy2@example.com",
        name: "Legacy 2",
      };
      const service = createAuthService({
        userBySupabaseId: null,
        userByEmail: legacy,
        counts: { cvVersions: 1 },
      });

      await assert.rejects(
        () => service.findOrCreateUser("sb-legacy-2", "legacy2@example.com"),
        (err: unknown) =>
          err instanceof UnauthorizedException &&
          err.message.includes("Account recovery required"),
      );
    },
  },
];

async function run(): Promise<void> {
  let failed = false;
  for (const test of tests) {
    try {
      await test.run();
      console.log(`PASS: ${test.name}`);
    } catch (err) {
      failed = true;
      console.error(`FAIL: ${test.name}`);
      console.error(err);
    }
  }

  if (failed) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
