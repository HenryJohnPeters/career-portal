import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { UnauthorizedException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { SignJWT } from "jose";
import { AuthService } from "./auth.service";
import type { SupabaseIdentity } from "./token-verifier";

const SECRET = "test-secret-for-hs256-tokens-0123456789";

interface UserRow {
  id: string;
  supabaseId: string | null;
  email: string;
  name: string;
}

function conflict(code: "P2002" | "P2025") {
  return new Prisma.PrismaClientKnownRequestError(`fake ${code}`, {
    code,
    clientVersion: "test",
  });
}

/** In-memory stand-in for the parts of PrismaService that AuthService uses. */
function fakePrisma(
  initial: UserRow[] = [],
  options: { activity?: number; beforeCreate?: (users: UserRow[]) => void } = {},
) {
  const users = initial.map((u) => ({ ...u }));
  const calls = { findUnique: 0, create: 0, update: 0, updateMany: 0 };
  const assertUnique = (data: Partial<UserRow>, selfId?: string) => {
    for (const u of users) {
      if (u.id === selfId) continue;
      if (data.email !== undefined && u.email === data.email) throw conflict("P2002");
      if (data.supabaseId && u.supabaseId === data.supabaseId) throw conflict("P2002");
    }
  };
  const count = async () => options.activity ?? 0;

  const prisma = {
    user: {
      findUnique: async ({ where }: { where: Partial<UserRow> }) => {
        calls.findUnique++;
        const row = users.find((u) =>
          where.id !== undefined
            ? u.id === where.id
            : where.supabaseId !== undefined
              ? u.supabaseId === where.supabaseId
              : u.email === where.email,
        );
        return row ? { ...row } : null;
      },
      create: async ({ data }: { data: Omit<UserRow, "id"> }) => {
        calls.create++;
        options.beforeCreate?.(users);
        assertUnique(data);
        const row = { id: `user-${users.length + 1}`, ...data };
        users.push(row);
        return { ...row };
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<UserRow> }) => {
        calls.update++;
        const row = users.find((u) => u.id === where.id);
        if (!row) throw conflict("P2025");
        assertUnique(data, row.id);
        Object.assign(row, data);
        return { ...row };
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; supabaseId: null };
        data: Partial<UserRow>;
      }) => {
        calls.updateMany++;
        const row = users.find((u) => u.id === where.id && u.supabaseId === null);
        if (!row) return { count: 0 };
        assertUnique(data, row.id);
        Object.assign(row, data);
        return { count: 1 };
      },
    },
    cvVersion: { count },
    coverLetter: { count },
    job: { count },
    interviewSession: { count },
    technicalTest: { count },
    aiUsage: { count },
  };
  return { prisma, users, calls };
}

function createService(fake: ReturnType<typeof fakePrisma>) {
  const config = {
    get: (key: string) => (key === "SUPABASE_JWT_SECRET" ? SECRET : undefined),
  };
  return new AuthService(fake.prisma as never, config as never);
}

function identity(overrides: Partial<SupabaseIdentity> = {}): SupabaseIdentity {
  return {
    supabaseId: "sb-1",
    email: "user@example.com",
    name: "User One",
    issuedAt: undefined,
    ...overrides,
  };
}

async function token(
  claims: { sub?: string; email?: string; iat?: number } = {},
): Promise<string> {
  const iat = claims.iat ?? Math.floor(Date.now() / 1000);
  return new SignJWT({ email: claims.email ?? "user@example.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub ?? "sb-1")
    .setAudience("authenticated")
    .setIssuedAt(iat)
    .setExpirationTime(iat + 3600)
    .sign(new TextEncoder().encode(SECRET));
}

describe("AuthService.findOrCreateUser", () => {
  test("returns the user already linked to the identity", async () => {
    const fake = fakePrisma([
      { id: "u1", supabaseId: "sb-1", email: "user@example.com", name: "User" },
    ]);
    const user = await createService(fake).findOrCreateUser(identity());
    assert.equal(user.id, "u1");
    assert.equal(fake.calls.create, 0);
    assert.equal(fake.calls.update, 0);
  });

  test("creates a user, defaulting the name to the email's local part", async () => {
    const fake = fakePrisma();
    const user = await createService(fake).findOrCreateUser(
      identity({ name: undefined, email: "jane.doe@example.com" }),
    );
    assert.equal(user.supabaseId, "sb-1");
    assert.equal(user.name, "jane.doe");
    assert.equal(fake.users.length, 1);
  });

  test("a concurrent first request that loses the create race re-reads the winner's row", async () => {
    const fake = fakePrisma([], {
      beforeCreate: (users) => {
        if (users.length === 0) {
          users.push({ id: "winner", supabaseId: "sb-1", email: "user@example.com", name: "User" });
        }
      },
    });
    const user = await createService(fake).findOrCreateUser(identity());
    assert.equal(user.id, "winner");
    assert.equal(fake.users.length, 1);
  });

  test("follows an email change made in Supabase", async () => {
    const fake = fakePrisma([
      { id: "u1", supabaseId: "sb-1", email: "old@example.com", name: "User" },
    ]);
    const user = await createService(fake).findOrCreateUser(
      identity({ email: "new@example.com" }),
    );
    assert.equal(user.email, "new@example.com");
    assert.equal(fake.users[0].email, "new@example.com");
  });

  test("keeps the old email when the new one is held by another row", async () => {
    const fake = fakePrisma([
      { id: "u1", supabaseId: "sb-1", email: "old@example.com", name: "User" },
      { id: "u2", supabaseId: null, email: "new@example.com", name: "Legacy" },
    ]);
    const user = await createService(fake).findOrCreateUser(
      identity({ email: "new@example.com" }),
    );
    assert.equal(user.id, "u1");
    assert.equal(user.email, "old@example.com");
  });

  test("links an unlinked legacy row that has no activity", async () => {
    const fake = fakePrisma([
      { id: "legacy", supabaseId: null, email: "user@example.com", name: "Legacy" },
    ]);
    const user = await createService(fake).findOrCreateUser(identity());
    assert.equal(user.id, "legacy");
    assert.equal(fake.users[0].supabaseId, "sb-1");
  });

  test("refuses to auto-link a legacy row that already holds data", async () => {
    const fake = fakePrisma(
      [{ id: "legacy", supabaseId: null, email: "user@example.com", name: "Legacy" }],
      { activity: 1 },
    );
    await assert.rejects(
      () => createService(fake).findOrCreateUser(identity()),
      (err: unknown) =>
        err instanceof UnauthorizedException &&
        err.message.includes("Account recovery required"),
    );
    assert.equal(fake.users[0].supabaseId, null);
  });

  test("never takes over or alters a row linked to a different identity with the same email", async () => {
    const fake = fakePrisma([
      { id: "old", supabaseId: "sb-old", email: "user@example.com", name: "Old" },
    ]);
    await assert.rejects(
      () => createService(fake).findOrCreateUser(identity({ supabaseId: "sb-new" })),
      (err: unknown) =>
        err instanceof UnauthorizedException && /different sign-in/.test(err.message),
    );
    assert.deepEqual(fake.users, [
      { id: "old", supabaseId: "sb-old", email: "user@example.com", name: "Old" },
    ]);
  });
});

describe("AuthService.authenticate", () => {
  test("verifies the token, creates the user, then serves repeats from the cache", async () => {
    const fake = fakePrisma();
    const service = createService(fake);
    const first = await service.authenticate(await token());
    const lookups = fake.calls.findUnique;
    const second = await service.authenticate(await token());
    assert.equal(first, second);
    assert.equal(fake.calls.findUnique, lookups, "no DB lookup on a cache hit");
  });

  test("an email change in the token bypasses the cache and re-syncs", async () => {
    const fake = fakePrisma();
    const service = createService(fake);
    await service.authenticate(await token());
    await service.authenticate(await token({ email: "Changed@Example.com" }));
    assert.equal(fake.users[0].email, "changed@example.com");
  });

  test("rejects an invalid token with 401", async () => {
    const service = createService(fakePrisma());
    await assert.rejects(
      () => service.authenticate("not-a-jwt"),
      (err: unknown) => err instanceof UnauthorizedException,
    );
  });

  test("after deletion, tokens issued earlier are refused; a later sign-in starts a new account", async () => {
    const fake = fakePrisma();
    const service = createService(fake);
    const before = await token({ iat: Math.floor(Date.now() / 1000) - 5 });
    const originalId = await service.authenticate(before);
    fake.users.length = 0; // the account is deleted
    service.forgetIdentity("sb-1");

    await assert.rejects(
      () => service.authenticate(before),
      (err: unknown) =>
        err instanceof UnauthorizedException && /deleted/.test(err.message),
    );
    assert.equal(fake.users.length, 0, "no empty account recreated");

    const after = await token({ iat: Math.floor(Date.now() / 1000) + 2 });
    const newId = await service.authenticate(after);
    assert.equal(fake.users.length, 1);
    assert.equal(newId, fake.users[0].id);
    assert.ok(originalId);
  });

  test("a request already resolving the user when the account is deleted never recreates it", async () => {
    const fake = fakePrisma([
      { id: "u1", supabaseId: "sb-1", email: "user@example.com", name: "User" },
    ]);
    const service = createService(fake);
    const earlier = await token({ iat: Math.floor(Date.now() / 1000) - 5 });
    // The deletion lands after this request's token check, before its user lookup.
    const realFind = fake.prisma.user.findUnique;
    fake.prisma.user.findUnique = async (args) => {
      if (fake.users.length) {
        service.forgetIdentity("sb-1");
        fake.users.length = 0;
      }
      return realFind(args);
    };
    await assert.rejects(
      () => service.authenticate(earlier),
      (err: unknown) =>
        err instanceof UnauthorizedException && /deleted/.test(err.message),
    );
    assert.equal(fake.calls.create, 0, "no empty account recreated");
  });
});
