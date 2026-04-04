import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { User } from "@careerportal/shared/types";
import { supabase } from "@careerportal/web/data-access";
import { api } from "@careerportal/web/data-access";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // Fetch user data manually instead of using useMe hook
  const fetchUser = useCallback(async () => {
    try {
      setIsLoadingUser(true);
      const response = await api.get<{ data: User }>("/auth/me");
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  // Single effect: onAuthStateChange always fires INITIAL_SESSION on attach,
  // which gives us the initial session state without a separate getSession()
  // call. Using getSession() + onAuthStateChange together causes two concurrent
  // GET /auth/me requests on every page load (race condition).
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // INITIAL_SESSION fires once synchronously when the listener is
        // registered. It's the canonical way to read the initial auth state.
        if (event === "INITIAL_SESSION") {
          setSupabaseReady(true);
        }

        setHasSession(!!session);

        // On password recovery, Supabase establishes a session but we
        // should NOT fetch user data — the ResetPasswordPage handles it.
        if (event === "PASSWORD_RECOVERY") {
          return;
        }

        if (session) {
          fetchUser();
        } else {
          setUser(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHasSession(false);
  }, []);

  const loading = !supabaseReady || (hasSession && isLoadingUser);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, logout, isLoading: loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
