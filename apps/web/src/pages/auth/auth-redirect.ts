import { readStorage, removeStorage, writeStorage } from "../../lib/storage";

/*
 * Where to send someone after they sign in, sign up or follow an email link.
 * Every destination that comes from a URL or router state is re-validated
 * here, so none of them can become an open redirect.
 */

export const APP_HOME_PATH = "/app/dashboard";
/** BillingPage shows a "finish upgrading" prompt for `?upgrade=1`. */
export const UPGRADE_PATH = "/app/billing?upgrade=1";

const PLACEHOLDER_ORIGIN = "https://career-portal.invalid";
const MAX_PATH_LENGTH = 2048;

/**
 * Returns `value` as a same-origin path inside the app ("/app" or "/app/…"),
 * or null. Rejects absolute and protocol-relative URLs, backslashes and
 * control characters (browsers normalise "/\evil.com" to "//evil.com"), and
 * dot segments that would climb out of /app.
 */
export function safeAppPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_PATH_LENGTH) {
    return null;
  }
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null;

  let url: URL;
  try {
    url = new URL(value, PLACEHOLDER_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return null;
  if (url.pathname !== "/app" && !url.pathname.startsWith("/app/")) return null;
  if (url.pathname.includes("//")) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

/** The premium choice at sign-up wins once; otherwise a validated deep link; else the dashboard. */
export function resolvePostAuthPath(options: { requested?: unknown; premiumIntent?: boolean }): string {
  if (options.premiumIntent) return UPGRADE_PATH;
  return safeAppPath(options.requested) ?? APP_HOME_PATH;
}

// === "Create account & go Premium" intent ===
// With email confirmation on, sign-up ends on "check your email", so the
// choice is remembered here (same device) and also carried in the
// confirmation link as `?intent=premium` (any device).

const INTENT_KEY = "careerportal:plan-intent";
/** Long enough to confirm the email a day or two later. */
export const PREMIUM_INTENT_TTL_MS = 3 * 24 * 60 * 60 * 1000;
export const PREMIUM_INTENT_PARAM = "intent";
export const PREMIUM_INTENT_VALUE = "premium";

export function serializePremiumIntent(now: number): string {
  return JSON.stringify({ plan: PREMIUM_INTENT_VALUE, expiresAt: now + PREMIUM_INTENT_TTL_MS });
}

/** True for an unexpired intent written by serializePremiumIntent. */
export function isPremiumIntentActive(raw: string | null, now: number): boolean {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { plan?: unknown; expiresAt?: unknown };
    return (
      parsed.plan === PREMIUM_INTENT_VALUE &&
      typeof parsed.expiresAt === "number" &&
      parsed.expiresAt > now &&
      parsed.expiresAt - now <= PREMIUM_INTENT_TTL_MS
    );
  } catch {
    return false;
  }
}

export function rememberPremiumIntent(now = Date.now()): void {
  writeStorage(INTENT_KEY, serializePremiumIntent(now));
}

export function forgetPremiumIntent(): void {
  removeStorage(INTENT_KEY);
}

/** Reads and clears the stored intent, so it is acted on at most once. */
export function takePremiumIntent(now = Date.now()): boolean {
  const raw = readStorage(INTENT_KEY);
  if (raw !== null) removeStorage(INTENT_KEY);
  return isPremiumIntentActive(raw, now);
}

// === Email links (/auth/callback) ===

/** Absolute /auth/callback URL for Supabase `emailRedirectTo` / `redirectTo`. */
export function authCallbackUrl(origin: string, params: Record<string, string> = {}): string {
  const url = new URL("/auth/callback", origin);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

export interface AuthCallbackParams {
  /** Supabase error code (e.g. "otp_expired"), or the generic `error` value. */
  errorCode: string | null;
  /** "recovery" for password-reset links. */
  type: string | null;
  /** Requested destination; validate with safeAppPath before use. */
  next: string | null;
  premiumIntent: boolean;
  /** Supabase informational redirect (e.g. the first half of a secure email change). */
  hasMessage: boolean;
}

/**
 * Supabase reports link errors in the hash (implicit flow) or the query
 * (PKCE). The free-text `error_description` / `message` values are never
 * shown: anyone can craft a link carrying arbitrary text.
 */
export function parseAuthCallbackParams(search: string, hash: string): AuthCallbackParams {
  const query = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const fragment = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const pick = (key: string) => query.get(key) ?? fragment.get(key);

  const errorCode = pick("error_code") ?? pick("error") ?? (pick("error_description") ? "unknown" : null);
  return {
    errorCode,
    type: pick("type"),
    next: query.get("next"),
    premiumIntent: query.get(PREMIUM_INTENT_PARAM) === PREMIUM_INTENT_VALUE,
    hasMessage: pick("message") !== null,
  };
}

// === Password recovery ===
// ResetPasswordPage only accepts a session that arrived through a recovery
// link; signed-in users change their password in Settings, which asks for
// the current one.

const RECOVERY_KEY = "careerportal:password-recovery";
const RECOVERY_TTL_MS = 60 * 60 * 1000;

export function markPasswordRecovery(now = Date.now()): void {
  writeStorage(RECOVERY_KEY, String(now + RECOVERY_TTL_MS), "session");
}

export function hasPasswordRecovery(now = Date.now()): boolean {
  const expiresAt = Number(readStorage(RECOVERY_KEY, "session"));
  return Number.isFinite(expiresAt) && expiresAt > now;
}

export function clearPasswordRecovery(): void {
  removeStorage(RECOVERY_KEY, "session");
}

/** Router state that marks a navigation to /reset-password as a recovery. */
export interface RecoveryNavigationState {
  recovery: true;
}

export function isRecoveryNavigationState(state: unknown): state is RecoveryNavigationState {
  return typeof state === "object" && state !== null && (state as { recovery?: unknown }).recovery === true;
}
