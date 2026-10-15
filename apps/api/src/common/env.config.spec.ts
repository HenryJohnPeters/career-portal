import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  corsAllowedOrigins,
  DEV_CORS_ORIGINS,
  isCorsOriginAllowed,
  validateEnv,
} from "./env.config";

const base = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  SUPABASE_JWT_SECRET: "jwt-secret",
  OPENAI_API_KEY: "sk-test",
  STRIPE_SECRET_KEY: "sk_test_x",
  STRIPE_PRICE_ID: "price_x",
  STRIPE_WEBHOOK_SECRET: "whsec_x",
};

const production = {
  ...base,
  NODE_ENV: "production",
  CLIENT_URL: "https://app.example.com",
};

function invalid(env: Record<string, unknown>, pattern: RegExp) {
  assert.throws(() => validateEnv(env), (err: unknown) => {
    assert.ok(err instanceof Error);
    assert.match(err.message, pattern);
    return true;
  });
}

describe("validateEnv", () => {
  test("development defaults", () => {
    const env = validateEnv(base);
    assert.equal(env.NODE_ENV, "development");
    assert.equal(env.CLIENT_URL, "http://localhost:4200");
    assert.deepEqual(env.CORS_ORIGINS, []);
    assert.equal(env.PORT, 3000);
    assert.equal(env.TRUST_PROXY_HOPS, 1);
    assert.equal(env.STRIPE_TRIAL_DAYS, 0);
    assert.equal(env.OPENAI_MODEL_STANDARD, "gpt-4o");
    assert.equal(env.OPENAI_MODEL_LIGHT, "gpt-4o-mini");
  });

  test("drops unknown keys and reads the object it is given (not process.env)", () => {
    const env = validateEnv({ ...base, SOMETHING_ELSE: "x", PORT: "4100" });
    assert.equal(env.PORT, 4100);
    assert.equal("SOMETHING_ELSE" in env, false);
  });

  test("normalises web URLs to their origin and strips trailing slashes from SUPABASE_URL", () => {
    const env = validateEnv({
      ...base,
      CLIENT_URL: "https://app.example.com/some/path/",
      SUPABASE_URL: "https://abc.supabase.co/",
      CORS_ORIGINS: " https://www.example.com/ , https://example.com ",
    });
    assert.equal(env.CLIENT_URL, "https://app.example.com");
    assert.equal(env.SUPABASE_URL, "https://abc.supabase.co");
    assert.deepEqual(env.CORS_ORIGINS, ["https://www.example.com", "https://example.com"]);
    assert.equal(
      validateEnv({ ...base, SUPABASE_URL: "https://sb.example.com/supabase//" }).SUPABASE_URL,
      "https://sb.example.com/supabase",
    );
    invalid({ ...base, SUPABASE_URL: "https://abc.supabase.co/?x=1" }, /SUPABASE_URL/);
  });

  test("coerces numbers and treats blank values as unset", () => {
    const env = validateEnv({
      ...base,
      STRIPE_TRIAL_DAYS: "14",
      TRUST_PROXY_HOPS: "2",
      SUPABASE_URL: "  ",
      ADMIN_API_KEY: "",
      OPENAI_MODEL_LIGHT: "",
    });
    assert.equal(env.STRIPE_TRIAL_DAYS, 14);
    assert.equal(env.TRUST_PROXY_HOPS, 2);
    assert.equal(env.SUPABASE_URL, undefined);
    assert.equal(env.ADMIN_API_KEY, undefined);
    assert.equal(env.OPENAI_MODEL_LIGHT, "gpt-4o-mini");
  });

  test("rejects out-of-range trial days and proxy hops", () => {
    invalid({ ...base, STRIPE_TRIAL_DAYS: "-1" }, /STRIPE_TRIAL_DAYS/);
    invalid({ ...base, STRIPE_TRIAL_DAYS: "731" }, /STRIPE_TRIAL_DAYS/);
    invalid({ ...base, STRIPE_TRIAL_DAYS: "1.5" }, /STRIPE_TRIAL_DAYS/);
    invalid({ ...base, TRUST_PROXY_HOPS: "-1" }, /TRUST_PROXY_HOPS/);
  });

  test("requires SUPABASE_URL or SUPABASE_JWT_SECRET", () => {
    const { SUPABASE_JWT_SECRET: _secret, ...noAuth } = base;
    invalid(noAuth, /SUPABASE_URL/);
    assert.equal(
      validateEnv({ ...noAuth, SUPABASE_URL: "https://abc.supabase.co" }).SUPABASE_URL,
      "https://abc.supabase.co",
    );
  });

  test("the service-role key requires SUPABASE_URL", () => {
    invalid({ ...base, SUPABASE_SERVICE_ROLE_KEY: "service-key" }, /SUPABASE_URL/);
  });

  test("ADMIN_API_KEY must be at least 32 characters, and errors never echo values", () => {
    const weak = "weak-admin-key-value";
    assert.throws(
      () => validateEnv({ ...base, ADMIN_API_KEY: weak }),
      (err: unknown) =>
        err instanceof Error &&
        /ADMIN_API_KEY/.test(err.message) &&
        !err.message.includes(weak),
    );
    assert.equal(validateEnv({ ...base, ADMIN_API_KEY: "k".repeat(32) }).ADMIN_API_KEY, "k".repeat(32));
  });

  test("rejects missing required secrets", () => {
    const { STRIPE_WEBHOOK_SECRET: _w, ...missing } = base;
    invalid(missing, /STRIPE_WEBHOOK_SECRET/);
  });

  describe("production", () => {
    test("accepts a public https CLIENT_URL", () => {
      const env = validateEnv(production);
      assert.equal(env.CLIENT_URL, "https://app.example.com");
    });

    test("requires CLIENT_URL instead of defaulting to localhost", () => {
      const { CLIENT_URL: _url, ...noClient } = production;
      invalid(noClient, /CLIENT_URL: is required in production/);
    });

    test("rejects http and localhost CLIENT_URL", () => {
      invalid({ ...production, CLIENT_URL: "http://app.example.com" }, /CLIENT_URL/);
      invalid({ ...production, CLIENT_URL: "https://localhost:4200" }, /CLIENT_URL/);
    });

    test("rejects http CORS_ORIGINS and SUPABASE_URL", () => {
      invalid({ ...production, CORS_ORIGINS: "http://www.example.com" }, /CORS_ORIGINS/);
      invalid({ ...production, SUPABASE_URL: "http://abc.supabase.co" }, /SUPABASE_URL/);
    });
  });
});

describe("CORS origins", () => {
  test("production allows exactly CLIENT_URL and CORS_ORIGINS", () => {
    const allowed = corsAllowedOrigins(
      validateEnv({ ...production, CORS_ORIGINS: "https://www.example.com" }),
    );
    assert.deepEqual([...allowed].sort(), ["https://app.example.com", "https://www.example.com"]);
    for (const dev of DEV_CORS_ORIGINS) assert.equal(allowed.has(dev), false);
  });

  test("development also allows the local web dev server", () => {
    const allowed = corsAllowedOrigins(validateEnv(base));
    assert.equal(allowed.has("http://localhost:4200"), true);
  });

  test("no Origin (server-to-server) and unknown origins get no CORS grant, never an error", () => {
    const allowed = corsAllowedOrigins(validateEnv(production));
    assert.equal(isCorsOriginAllowed(undefined, allowed), false);
    assert.equal(isCorsOriginAllowed("https://evil.example", allowed), false);
    assert.equal(isCorsOriginAllowed("https://app.example.com", allowed), true);
    assert.equal(isCorsOriginAllowed("https://app.example.com/", allowed), false);
  });
});
