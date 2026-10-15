import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  APP_HOME_PATH,
  PREMIUM_INTENT_TTL_MS,
  UPGRADE_PATH,
  authCallbackUrl,
  isPremiumIntentActive,
  isRecoveryNavigationState,
  parseAuthCallbackParams,
  resolvePostAuthPath,
  safeAppPath,
  serializePremiumIntent,
} from "./auth-redirect";

describe("safeAppPath", () => {
  test("accepts in-app paths, keeping query and hash", () => {
    assert.equal(safeAppPath("/app"), "/app");
    assert.equal(safeAppPath("/app/jobs"), "/app/jobs");
    assert.equal(safeAppPath("/app/practice?session=abc#q2"), "/app/practice?session=abc#q2");
  });

  test("rejects anything outside /app", () => {
    for (const value of ["/", "/login", "/apple", "/application", "/app-store", "app/jobs", "", "   "]) {
      assert.equal(safeAppPath(value), null, value);
    }
  });

  test("rejects open-redirect tricks", () => {
    for (const value of [
      "//evil.com/app/jobs",
      "https://evil.com/app/jobs",
      "/\\evil.com",
      "/app\\..\\evil",
      "/app/../login",
      "/app/%2e%2e/login",
      "/app//evil.com",
      "/app/\tjobs",
      "javascript:alert(1)",
      `/app/${"x".repeat(3000)}`,
    ]) {
      assert.equal(safeAppPath(value), null, value);
    }
  });

  test("rejects non-strings", () => {
    assert.equal(safeAppPath(undefined), null);
    assert.equal(safeAppPath(null), null);
    assert.equal(safeAppPath({ pathname: "/app" }), null);
  });
});

describe("resolvePostAuthPath", () => {
  test("premium intent wins over a deep link", () => {
    assert.equal(resolvePostAuthPath({ requested: "/app/jobs", premiumIntent: true }), UPGRADE_PATH);
  });

  test("valid deep link, else the dashboard", () => {
    assert.equal(resolvePostAuthPath({ requested: "/app/jobs?id=1" }), "/app/jobs?id=1");
    assert.equal(resolvePostAuthPath({ requested: "https://evil.com" }), APP_HOME_PATH);
    assert.equal(resolvePostAuthPath({}), APP_HOME_PATH);
  });
});

describe("premium intent", () => {
  const now = Date.UTC(2026, 9, 15, 12);

  test("round-trips and expires", () => {
    const raw = serializePremiumIntent(now);
    assert.equal(isPremiumIntentActive(raw, now), true);
    assert.equal(isPremiumIntentActive(raw, now + PREMIUM_INTENT_TTL_MS - 1), true);
    assert.equal(isPremiumIntentActive(raw, now + PREMIUM_INTENT_TTL_MS), false);
  });

  test("rejects malformed or tampered values", () => {
    assert.equal(isPremiumIntentActive(null, now), false);
    assert.equal(isPremiumIntentActive("premium", now), false);
    assert.equal(isPremiumIntentActive("{}", now), false);
    assert.equal(isPremiumIntentActive(JSON.stringify({ plan: "free", expiresAt: now + 1000 }), now), false);
    assert.equal(isPremiumIntentActive(JSON.stringify({ plan: "premium", expiresAt: "soon" }), now), false);
    // An expiry further out than the TTL was not written by us.
    assert.equal(
      isPremiumIntentActive(JSON.stringify({ plan: "premium", expiresAt: now + PREMIUM_INTENT_TTL_MS * 10 }), now),
      false,
    );
  });
});

describe("authCallbackUrl", () => {
  test("builds an absolute callback URL with encoded params", () => {
    assert.equal(authCallbackUrl("https://career-repo.com"), "https://career-repo.com/auth/callback");
    assert.equal(
      authCallbackUrl("https://career-repo.com", { next: "/app/settings", intent: "premium" }),
      "https://career-repo.com/auth/callback?next=%2Fapp%2Fsettings&intent=premium",
    );
  });
});

describe("parseAuthCallbackParams", () => {
  test("reads link errors from the hash (implicit flow) or the query (PKCE)", () => {
    const fromHash = parseAuthCallbackParams(
      "",
      "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
    );
    assert.equal(fromHash.errorCode, "otp_expired");
    const fromQuery = parseAuthCallbackParams("?error=access_denied", "");
    assert.equal(fromQuery.errorCode, "access_denied");
    const descriptionOnly = parseAuthCallbackParams("", "#error_description=Anything");
    assert.equal(descriptionOnly.errorCode, "unknown");
  });

  test("reads type, next, intent and notices", () => {
    const params = parseAuthCallbackParams("?type=recovery&next=%2Fapp%2Fsettings&intent=premium", "");
    assert.equal(params.type, "recovery");
    assert.equal(params.next, "/app/settings");
    assert.equal(params.premiumIntent, true);
    assert.equal(params.errorCode, null);
    assert.equal(parseAuthCallbackParams("?intent=enterprise", "").premiumIntent, false);
    assert.equal(parseAuthCallbackParams("", "#message=Confirmation+link+accepted").hasMessage, true);
  });

  test("never takes `next` from the hash", () => {
    assert.equal(parseAuthCallbackParams("", "#next=%2Fapp%2Fjobs").next, null);
  });
});

describe("isRecoveryNavigationState", () => {
  test("only the exact marker counts", () => {
    assert.equal(isRecoveryNavigationState({ recovery: true }), true);
    assert.equal(isRecoveryNavigationState({ recovery: "true" }), false);
    assert.equal(isRecoveryNavigationState(null), false);
    assert.equal(isRecoveryNavigationState(undefined), false);
  });
});
