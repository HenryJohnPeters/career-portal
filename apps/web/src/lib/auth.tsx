import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@careerportal/shared/types";
import {
  dismissUpgrade,
  getErrorMessage,
  queryKeys,
  supabase,
  useMe,
} from "@careerportal/web/data-access";
import { showToast } from "./toast";

export interface LogoutOptions {
  /** Revoke the session on every device ("Sign out everywhere"), not just this browser. */
  everywhere?: boolean;
  /** Same-origin path to land on afterwards (default "/login"). */
  redirectTo?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /** True only until the user is first loaded after sign-in, never during background refreshes. */
  isLoading: boolean;
  /** Set when the user could not be loaded at all; failed background refreshes keep the current user. */
  authError: string | null;
  /** Background re-fetch of /auth/me (e.g. after an upgrade). Never unmounts the app. */
  refreshUser: () => Promise<void>;
  /**
   * Signs out, clears every cached query and hard-navigates (wiping all
   * in-memory state). Resolves false, after showing a toast, when the session
   * could not be ended (e.g. offline) — the user stays signed in.
   */
  logout: (options?: LogoutOptions) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Same-origin path only. Resolving through URL (rather than prefix checks)
 * also rejects values such as "/\t/evil.com", which browsers normalise into a
 * protocol-relative off-site URL.
 */
function safeRedirectPath(path: string | undefined): string {
  if (!path || !path.startsWith("/")) return "/login";
  try {
    const url = new URL(path, window.location.origin);
    if (url.origin !== window.location.origin) return "/login";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/login";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [supabaseReady, setSupabaseReady] = useState(false);
  /** Supabase user id of the current session (null when signed out). */
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const sessionUserIdRef = useRef<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  // onAuthStateChange always emits INITIAL_SESSION first, so no separate
  // getSession() call is needed.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "INITIAL_SESSION") setSupabaseReady(true);

        // Recovery sessions belong to ResetPasswordPage: don't load the app user.
        if (event === "PASSWORD_RECOVERY") return;

        // Hourly TOKEN_REFRESHED and the SIGNED_IN emitted on every tab refocus
        // keep the same user id, so they fall through as no-ops below. A
        // TOKEN_REFRESHED that brings a session back (INITIAL_SESSION was null
        // because the startup refresh failed offline) is adopted like a sign-in.
        const nextId = session?.user.id ?? null;
        const previousId = sessionUserIdRef.current;
        if (nextId !== previousId) {
          // Signed out, or a different account signed in (e.g. in another tab):
          // drop every cached query so nothing of the previous account remains.
          // Clearing also cancels in-flight requests, so stale responses are ignored.
          if (previousId !== null) {
            queryClient.clear();
            dismissUpgrade();
          }
          sessionUserIdRef.current = nextId;
          setSessionUserId(nextId);
          return;
        }

        if (event === "USER_UPDATED" && nextId) {
          // e.g. a confirmed email change: refresh quietly.
          void queryClient.invalidateQueries({ queryKey: queryKeys.me });
        }
      },
    );
    return () => listener.subscription.unsubscribe();
  }, [queryClient]);

  // React Query dedupes concurrent /auth/me calls and keeps the loaded user
  // during background refetches, so the app never unmounts after first load.
  const meQuery = useMe(sessionUserId !== null && !signingOut);
  const user = sessionUserId !== null ? (meQuery.data?.data ?? null) : null;
  const authError =
    sessionUserId !== null && !user && meQuery.isError
      ? getErrorMessage(meQuery.error, "We couldn't load your account. Please try again.")
      : null;
  const isLoading =
    !supabaseReady || signingOut || (sessionUserId !== null && !user && !authError);

  const refreshUser = useCallback(async () => {
    if (sessionUserIdRef.current === null) return;
    await queryClient.refetchQueries({ queryKey: queryKeys.me, exact: true });
  }, [queryClient]);

  const logout = useCallback(
    async (options: LogoutOptions = {}) => {
      let failed = false;
      try {
        const { error } = await supabase.auth.signOut({
          scope: options.everywhere ? "global" : "local",
        });
        failed = Boolean(error);
      } catch {
        failed = true;
      }

      if (failed) {
        // auth-js keeps the stored session when the sign-out request fails
        // (offline, 5xx). Never show a signed-out UI over a live session.
        const { data } = await supabase.auth.getSession().catch(() => ({
          data: { session: null },
        }));
        if (data.session) {
          showToast(
            "error",
            "We couldn't sign you out. Check your connection and try again.",
          );
          return false;
        }
      }

      setSigningOut(true);
      queryClient.clear();
      dismissUpgrade();
      window.location.replace(safeRedirectPath(options.redirectTo));
      return true;
    },
    [queryClient],
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      authError,
      refreshUser,
      logout,
    }),
    [user, isLoading, authError, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
