/*
 * What the URL a page was loaded with carried for Supabase auth, read before
 * the Supabase client consumes it.
 *
 * The client uses the PKCE flow: an email link's `?code=` becomes a session
 * only in the browser that started the flow, because only that browser holds
 * the matching code verifier. Session tokens in a URL (the implicit flow) are
 * never adopted: anyone can craft such a link to sign a victim into the
 * attacker's account, so they are stripped from the address bar and history.
 */

export interface AuthUrlState {
  /** Path the page was loaded at, so a later in-app visit is not mistaken for the email link. */
  pathname: string;
  /**
   * "redeemable": a `?code=` this browser holds the verifier for (the client
   * exchanges it while starting up); "foreign": a code from a flow started in
   * another browser, which can't become a session here; "none": no code.
   */
  code: "none" | "redeemable" | "foreign";
  /** The code answers a password-reset request made in this browser. */
  recovery: boolean;
  /** Session tokens were in the URL; they were removed and ignored. */
  implicitTokens: boolean;
}

/** auth-js appends this to the stored verifier when the flow is resetPasswordForEmail. */
const RECOVERY_SUFFIX = "/PASSWORD_RECOVERY";

/** URL keys of an implicit-flow session. */
export const IMPLICIT_TOKEN_KEYS = [
  "access_token",
  "refresh_token",
  "expires_in",
  "expires_at",
  "token_type",
  "provider_token",
  "provider_refresh_token",
] as const;

/** localStorage key of the PKCE code verifier for a client created with the default storage key. */
export function codeVerifierStorageKey(supabaseUrl: string): string | null {
  try {
    return `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token-code-verifier`;
  } catch {
    return null;
  }
}

/** auth-js stores the verifier JSON-encoded ("\"abc…/PASSWORD_RECOVERY\""). */
function parseStoredVerifier(raw: string | null): string {
  if (!raw) return "";
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : "";
  } catch {
    return raw;
  }
}

/**
 * Query and fragment parameters, merged the way auth-js reads them (the query
 * wins), so this agrees with what the client would act on.
 */
function urlParams(url: URL): Map<string, string> {
  const params = new Map<string, string>();
  if (url.hash.startsWith("#")) {
    for (const [key, value] of new URLSearchParams(url.hash.slice(1))) params.set(key, value);
  }
  for (const [key, value] of url.searchParams) params.set(key, value);
  return params;
}

export function readAuthUrlState(href: string, storedVerifier: string | null): AuthUrlState {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { pathname: "", code: "none", recovery: false, implicitTokens: false };
  }
  const params = urlParams(url);
  const implicitTokens = Boolean(params.get("access_token") || params.get("refresh_token"));
  const base = { pathname: url.pathname, implicitTokens };
  if (!params.get("code")) return { ...base, code: "none", recovery: false };

  const verifier = parseStoredVerifier(storedVerifier);
  if (!verifier) return { ...base, code: "foreign", recovery: false };
  return { ...base, code: "redeemable", recovery: verifier.endsWith(RECOVERY_SUFFIX) };
}

/** `href` without implicit-flow session tokens (in the query or the fragment); null when there are none. */
export function withoutImplicitTokens(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  let changed = false;
  for (const key of IMPLICIT_TOKEN_KEYS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (url.hash.startsWith("#")) {
    const fragment = new URLSearchParams(url.hash.slice(1));
    if (IMPLICIT_TOKEN_KEYS.some((key) => fragment.has(key))) {
      for (const key of IMPLICIT_TOKEN_KEYS) fragment.delete(key);
      const rest = fragment.toString();
      url.hash = rest ? `#${rest}` : "";
      changed = true;
    }
  }
  if (!changed) return null;
  // An emptied hash still serialises as "…#" in some engines.
  return url.toString().replace(/#$/, "");
}
