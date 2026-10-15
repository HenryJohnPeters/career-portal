import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { codeVerifierStorageKey, readAuthUrlState, withoutImplicitTokens } from "./auth-url";

const ORIGIN = "https://career-repo.com";

describe("readAuthUrlState", () => {
  test("a code this browser holds the verifier for is redeemable", () => {
    const state = readAuthUrlState(`${ORIGIN}/auth/callback?code=abc&next=%2Fapp%2Fjobs`, JSON.stringify("verifier"));
    assert.deepEqual(state, { pathname: "/auth/callback", code: "redeemable", recovery: false, implicitTokens: false });
  });

  test("only a verifier written by resetPasswordForEmail marks a recovery", () => {
    const recovery = readAuthUrlState(`${ORIGIN}/auth/callback?code=abc`, JSON.stringify("v/PASSWORD_RECOVERY"));
    assert.equal(recovery.recovery, true);
    // The query's `type` is attacker-controlled and never decides it.
    const typed = readAuthUrlState(`${ORIGIN}/auth/callback?code=abc&type=recovery`, JSON.stringify("v"));
    assert.equal(typed.recovery, false);
    const noCode = readAuthUrlState(`${ORIGIN}/auth/callback?type=recovery`, JSON.stringify("v/PASSWORD_RECOVERY"));
    assert.deepEqual([noCode.code, noCode.recovery], ["none", false]);
  });

  test("a code without a verifier (another browser) is foreign", () => {
    assert.equal(readAuthUrlState(`${ORIGIN}/auth/callback?code=abc`, null).code, "foreign");
    assert.equal(readAuthUrlState(`${ORIGIN}/auth/callback?code=abc`, "").code, "foreign");
  });

  test("a code in the fragment counts, as auth-js reads it", () => {
    assert.equal(readAuthUrlState(`${ORIGIN}/auth/callback#code=abc`, JSON.stringify("v")).code, "redeemable");
  });

  test("flags implicit-flow tokens in the fragment or the query", () => {
    assert.equal(readAuthUrlState(`${ORIGIN}/app/dashboard#access_token=x&refresh_token=y`, null).implicitTokens, true);
    assert.equal(readAuthUrlState(`${ORIGIN}/app?access_token=x`, null).implicitTokens, true);
    assert.equal(readAuthUrlState(`${ORIGIN}/auth/callback#error=access_denied`, null).implicitTokens, false);
  });

  test("tolerates a raw (non-JSON) stored verifier and a bad URL", () => {
    assert.equal(readAuthUrlState(`${ORIGIN}/auth/callback?code=abc`, "raw/PASSWORD_RECOVERY").recovery, true);
    assert.equal(readAuthUrlState("not a url", "v").code, "none");
  });
});

describe("withoutImplicitTokens", () => {
  test("removes session tokens and keeps everything else", () => {
    assert.equal(
      withoutImplicitTokens(
        `${ORIGIN}/app/dashboard?tab=x#access_token=a&expires_in=3600&refresh_token=r&token_type=bearer&type=magiclink`,
      ),
      `${ORIGIN}/app/dashboard?tab=x#type=magiclink`,
    );
    assert.equal(
      withoutImplicitTokens(`${ORIGIN}/app/dashboard#access_token=a&refresh_token=r`),
      `${ORIGIN}/app/dashboard`,
    );
    assert.equal(withoutImplicitTokens(`${ORIGIN}/app?access_token=a&x=1`), `${ORIGIN}/app?x=1`);
  });

  test("returns null when there is nothing to strip", () => {
    assert.equal(withoutImplicitTokens(`${ORIGIN}/auth/callback?code=abc#error=x`), null);
    assert.equal(withoutImplicitTokens("not a url"), null);
  });
});

test("codeVerifierStorageKey matches supabase-js's default storage key", () => {
  assert.equal(
    codeVerifierStorageKey("https://abcdxyz.supabase.co"),
    "sb-abcdxyz-auth-token-code-verifier",
  );
  assert.equal(codeVerifierStorageKey("not a url"), null);
});
