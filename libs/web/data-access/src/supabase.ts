import { createClient } from "@supabase/supabase-js";
import {
  codeVerifierStorageKey,
  readAuthUrlState,
  withoutImplicitTokens,
  type AuthUrlState,
} from "./auth-url";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

/** False when the build is missing its Supabase config — sign-in cannot work. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — auth will not work.",
  );
}

// createClient throws on an empty URL, which would blank the whole app; a
// placeholder keeps public pages rendering while every auth call fails.
const clientUrl = supabaseUrl || "https://placeholder.supabase.co";

function readStoredVerifier(): string | null {
  const key = codeVerifierStorageKey(clientUrl);
  if (!key) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Read once, before the client below looks at the URL (it removes `?code=`
 * and the code verifier while starting up). AuthCallbackPage decides from
 * this whether the email link signed the user in, and whether it was a
 * password reset. Session tokens in the URL are stripped first, so the
 * client never adopts them and they don't stay in the browser history.
 */
export const authUrlAtLoad: AuthUrlState = (() => {
  if (typeof window === "undefined") {
    return { pathname: "", code: "none", recovery: false, implicitTokens: false };
  }
  const state = readAuthUrlState(window.location.href, readStoredVerifier());
  if (state.implicitTokens) {
    const cleaned = withoutImplicitTokens(window.location.href);
    if (cleaned) window.history.replaceState(window.history.state, "", cleaned);
  }
  return state;
})();

// PKCE: an email link signs in only the browser that asked for it (see auth-url.ts).
export const supabase = createClient(clientUrl, supabaseAnonKey || "placeholder-key", {
  auth: { flowType: "pkce" },
});
