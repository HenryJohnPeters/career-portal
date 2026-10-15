import { useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@careerportal/web/ui";
import { useAuth } from "../lib/auth";
import { PageLoader } from "./PageLoader";

const SUPPORT_EMAIL = "support@career-repo.com";

function AccountLoadError({ message }: { message: string }) {
  const { refreshUser, logout } = useAuth();
  const [retrying, setRetrying] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const retry = async () => {
    setRetrying(true);
    try {
      await refreshUser();
    } finally {
      setRetrying(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    const done = await logout();
    if (!done) setSigningOut(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-6">
      <div role="alert" className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-200 dark:bg-red-900/20 dark:ring-red-800/50">
          <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-text-primary">We couldn't load your account</h1>
        <p className="mt-2 text-sm text-text-secondary">{message}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Button size="sm" loading={retrying} onClick={() => void retry()}>
            Try again
          </Button>
          <Button size="sm" variant="outline" loading={signingOut} onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
        <p className="mt-5 text-xs text-text-tertiary">
          Still stuck? Email{" "}
          <a className="font-medium text-primary-700 underline dark:text-primary-300" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </div>
    </div>
  );
}

/**
 * Gate for /app. Shows a loader only until the user is first loaded; signed
 * out users go to /login with `state.from` set to the page they wanted
 * (LoginPage should return there when it starts with "/app/").
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, authError } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader fullScreen label="Loading your account" />;
  if (authError) return <AccountLoadError message={authError} />;
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  return <>{children}</>;
}
