import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@careerportal/web/data-access";
import { Code2, Loader2, AlertCircle } from "lucide-react";

/**
 * Handles Supabase auth redirects (email confirmation, password recovery).
 *
 * Supabase appends tokens as a hash fragment (e.g. #access_token=...&type=recovery).
 * The Supabase client automatically picks these up via `onAuthStateChange`,
 * so we just need to wait for the session to be established and then route
 * the user to the right place.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        // Give Supabase a moment to process the hash fragment tokens
        // and establish the session via onAuthStateChange
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        if (!data.session) {
          // No session yet — wait for onAuthStateChange to fire
          const timeout = setTimeout(() => {
            if (!cancelled) {
              setError(
                "Unable to verify your session. The link may have expired — please try again."
              );
            }
          }, 10000);

          const { data: listener } = supabase.auth.onAuthStateChange(
            (event, session) => {
              if (cancelled) return;
              clearTimeout(timeout);

              if (
                event === "PASSWORD_RECOVERY" ||
                searchParams.get("type") === "recovery"
              ) {
                navigate("/reset-password", { replace: true });
              } else if (session) {
                navigate("/app/dashboard", { replace: true });
              }

              listener.subscription.unsubscribe();
            }
          );

          return () => {
            clearTimeout(timeout);
            listener.subscription.unsubscribe();
          };
        }

        // Session already exists
        // Check the hash fragment for the type
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const type = hashParams.get("type") || searchParams.get("type");

        if (type === "recovery") {
          navigate("/reset-password", { replace: true });
        } else {
          navigate("/app/dashboard", { replace: true });
        }
      } catch {
        if (!cancelled) {
          setError("Something went wrong. Please try again.");
        }
      }
    }

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col">
        <header className="h-16 bg-bg-secondary/80 backdrop-blur-xl border-b border-border flex items-center px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
              <Code2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-text-primary">
              Career Portal
            </span>
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30 mb-6">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-3">
              Verification failed
            </h1>
            <p className="text-sm text-text-secondary mb-6">{error}</p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/login"
                className="text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline"
              >
                Sign in
              </Link>
              <span className="text-text-tertiary">·</span>
              <Link
                to="/register"
                className="text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-sm text-text-secondary font-medium">
          Verifying your account…
        </p>
      </div>
    </div>
  );
}
