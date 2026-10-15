import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  createLocalJWKSet,
  errors,
  exportJWK,
  generateKeyPair,
  SignJWT,
  UnsecuredJWT,
  type JWTPayload,
  type JWTVerifyGetKey,
} from "jose";
import {
  AuthUnavailableError,
  InvalidTokenError,
  SupabaseTokenVerifier,
} from "./token-verifier";

const SECRET = "test-secret-for-hs256-tokens-0123456789";
const SUPABASE_URL = "https://project.supabase.co";
const ISSUER = `${SUPABASE_URL}/auth/v1`;

const now = () => Math.floor(Date.now() / 1000);

const baseClaims = {
  sub: "6f1c2b9e-0000-4000-8000-000000000001",
  email: "User@Example.com",
  aud: "authenticated",
  role: "authenticated",
  user_metadata: { name: "  Jane \n Doe  " },
};

function hs256(
  claims: JWTPayload,
  options: { exp?: number | null; secret?: string } = {},
): Promise<string> {
  const jwt = new SignJWT(claims).setProtectedHeader({ alg: "HS256" }).setIssuedAt();
  if (options.exp !== null) jwt.setExpirationTime(options.exp ?? now() + 3600);
  return jwt.sign(new TextEncoder().encode(options.secret ?? SECRET));
}

const hsVerifier = () => new SupabaseTokenVerifier({ jwtSecret: SECRET });

async function rejectsWith(
  promise: Promise<unknown>,
  expected: typeof InvalidTokenError | typeof AuthUnavailableError,
): Promise<Error> {
  let caught: unknown;
  await assert.rejects(promise, (err: unknown) => {
    caught = err;
    return err instanceof expected;
  });
  return caught as Error;
}

describe("SupabaseTokenVerifier: HS256 (legacy secret)", () => {
  test("accepts a valid token and normalises the identity", async () => {
    const identity = await hsVerifier().verify(await hs256(baseClaims));
    assert.equal(identity.supabaseId, baseClaims.sub);
    assert.equal(identity.email, "user@example.com");
    assert.equal(identity.name, "Jane Doe");
    assert.equal(typeof identity.issuedAt, "number");
  });

  test("rejects alg 'none'", async () => {
    const unsigned = new UnsecuredJWT(baseClaims).setExpirationTime("1h").encode();
    await rejectsWith(hsVerifier().verify(unsigned), InvalidTokenError);
  });

  test("rejects a wrong audience", async () => {
    const token = await hs256({ ...baseClaims, aud: "anon" });
    await rejectsWith(hsVerifier().verify(token), InvalidTokenError);
  });

  test("rejects a token without exp", async () => {
    const token = await hs256(baseClaims, { exp: null });
    await rejectsWith(hsVerifier().verify(token), InvalidTokenError);
  });

  test("rejects a token without sub", async () => {
    const { sub: _sub, ...claims } = baseClaims;
    await rejectsWith(hsVerifier().verify(await hs256(claims)), InvalidTokenError);
  });

  test("rejects an expired token", async () => {
    const token = await hs256(baseClaims, { exp: now() - 3600 });
    const err = (await rejectsWith(hsVerifier().verify(token), InvalidTokenError)) as InvalidTokenError;
    assert.equal(err.reason, "ERR_JWT_EXPIRED");
  });

  test("rejects a token signed with another secret", async () => {
    const token = await hs256(baseClaims, { secret: "some-other-secret-0123456789abcdef" });
    await rejectsWith(hsVerifier().verify(token), InvalidTokenError);
  });

  test("checks the issuer when SUPABASE_URL is configured", async () => {
    const verifier = new SupabaseTokenVerifier({
      jwtSecret: SECRET,
      supabaseUrl: SUPABASE_URL,
      jwks: createLocalJWKSet({ keys: [] }),
    });
    await rejectsWith(
      verifier.verify(await hs256({ ...baseClaims, iss: "https://evil.example/auth/v1" })),
      InvalidTokenError,
    );
    const ok = await verifier.verify(await hs256({ ...baseClaims, iss: ISSUER }));
    assert.equal(ok.supabaseId, baseClaims.sub);
  });

  test("refuses anonymous sessions and tokens without an email", async () => {
    const anonymous = (await rejectsWith(
      hsVerifier().verify(await hs256({ ...baseClaims, is_anonymous: true, email: "" })),
      InvalidTokenError,
    )) as InvalidTokenError;
    assert.match(anonymous.publicMessage, /email account/);
    await rejectsWith(
      hsVerifier().verify(await hs256({ ...baseClaims, email: "" })),
      InvalidTokenError,
    );
  });

  test("refuses non-user roles (e.g. a leaked service_role key)", async () => {
    const token = await hs256({ ...baseClaims, role: "service_role" });
    await rejectsWith(hsVerifier().verify(token), InvalidTokenError);
  });

  test("rejects HS256 when no secret is configured (no alg confusion with JWKS)", async () => {
    const verifier = new SupabaseTokenVerifier({
      supabaseUrl: SUPABASE_URL,
      jwks: createLocalJWKSet({ keys: [] }),
    });
    await rejectsWith(verifier.verify(await hs256(baseClaims)), InvalidTokenError);
  });

  test("rejects garbage", async () => {
    await rejectsWith(hsVerifier().verify("not.a.jwt"), InvalidTokenError);
    await rejectsWith(hsVerifier().verify(""), InvalidTokenError);
  });
});

describe("SupabaseTokenVerifier: ES256/RS256 (JWKS)", () => {
  async function keySet(alg: "ES256" | "RS256", kid: string) {
    const { publicKey, privateKey } = await generateKeyPair(alg);
    const jwk = { ...(await exportJWK(publicKey)), kid, alg, use: "sig" };
    const sign = (claims: JWTPayload, header: { kid?: string } = {}) =>
      new SignJWT(claims)
        .setProtectedHeader({ alg, kid: header.kid ?? kid })
        .setIssuer(ISSUER)
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(privateKey);
    return { jwk, sign };
  }

  for (const alg of ["ES256", "RS256"] as const) {
    test(`accepts a valid ${alg} token from the project's key set`, async () => {
      const { jwk, sign } = await keySet(alg, `kid-${alg}`);
      const verifier = new SupabaseTokenVerifier({
        supabaseUrl: SUPABASE_URL,
        jwks: createLocalJWKSet({ keys: [jwk] }),
      });
      const identity = await verifier.verify(await sign(baseClaims));
      assert.equal(identity.email, "user@example.com");
    });
  }

  test("an unknown kid is a bad token (401), not an outage", async () => {
    const { jwk, sign } = await keySet("ES256", "real");
    const verifier = new SupabaseTokenVerifier({
      supabaseUrl: SUPABASE_URL,
      jwks: createLocalJWKSet({ keys: [jwk] }),
    });
    await rejectsWith(verifier.verify(await sign(baseClaims, { kid: "forged" })), InvalidTokenError);
  });

  test("a JWKS timeout or network failure is an outage (503), not a 401", async () => {
    const { sign } = await keySet("ES256", "k1");
    const token = await sign(baseClaims);
    const failures: JWTVerifyGetKey[] = [
      async () => {
        throw new errors.JWKSTimeout();
      },
      async () => {
        throw Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" });
      },
    ];
    for (const jwks of failures) {
      const verifier = new SupabaseTokenVerifier({ supabaseUrl: SUPABASE_URL, jwks });
      await rejectsWith(verifier.verify(token), AuthUnavailableError);
    }
  });

  test("an ES256 token is rejected when only the HS256 secret is configured", async () => {
    const { sign } = await keySet("ES256", "k1");
    await rejectsWith(hsVerifier().verify(await sign(baseClaims)), InvalidTokenError);
  });
});
