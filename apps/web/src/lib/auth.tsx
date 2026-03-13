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

  // Wait for Supabase to restore session from storage
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setSupabaseReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setHasSession(!!session);
        if (session) {
          fetchUser();
        } else {
          setUser(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [fetchUser]);

  // Fetch user when supabase session is ready
  useEffect(() => {
    if (supabaseReady && hasSession) {
      fetchUser();
    }
  }, [supabaseReady, hasSession, fetchUser]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHasSession(false);
    // Don't use queryClient here - just clear local state
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
