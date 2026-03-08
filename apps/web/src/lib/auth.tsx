import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { User } from "@careerportal/shared/types";
import { supabase, queryKeys } from "@careerportal/web/data-access";
import { useMe } from "@careerportal/web/data-access";
import { useQueryClient } from "@tanstack/react-query";

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
  const [queryClientReady, setQueryClientReady] = useState(false);
  const queryClient = useQueryClient();

  // Ensure QueryClient is ready before using any hooks
  useEffect(() => {
    setQueryClientReady(true);
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
        // Force React Query to refetch /auth/me when session changes
        queryClient.invalidateQueries({ queryKey: queryKeys.me });
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [queryClient]);

  // Only call /auth/me once we know QueryClient is ready AND there's a Supabase session
  const shouldFetchUser = queryClientReady && hasSession;
  const { data, isLoading, isError } = useMe(shouldFetchUser);

  useEffect(() => {
    if (data?.data) {
      setUser(data.data);
    }
    if (isError) {
      setUser(null);
    }
  }, [data, isError]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHasSession(false);
  }, []);

  const loading = !supabaseReady || !queryClientReady || (hasSession && isLoading);

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
