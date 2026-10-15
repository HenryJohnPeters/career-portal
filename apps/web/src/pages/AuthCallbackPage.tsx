import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Clock, MailCheck } from "lucide-react";
import { supabase } from "@careerportal/web/data-access";
import { Spinner } from "@careerportal/web/ui";
import { AUTH_LINK_CLASS, AuthLayout } from "./auth/AuthLayout";
import { ResendConfirmation } from "./auth/ResendConfirmation";
import { SUPPORT_EMAIL, authLinkErrorMessage } from "./auth/auth-errors";
import {
  markPasswordRecovery,
  parseAuthCallbackParams,
  resolvePostAuthPath,
  takePremiumIntent,
  type AuthCallbackParams,
  type RecoveryNavigationState,
} from "./auth/auth-redirect";

/** How long to wait for Supabase to turn the link into a session. */
const SESSION_TIMEOUT_MS = 10_000;

type ViewState =
  | { kind: "verifying" }
  | { kind: "link-error"; message: string; recovery: boolean; premiumIntent: boolean }
  | { kind: "timeout"; recovery: boolean; premiumIntent: boolean }
  | { kind: "message" };

/**
 * Landing page for Supabase email links (sign-up confirmation, password
 * recovery, email change). The Supabase client exchanges the link's tokens
 * for a session on load; this page waits for that session, then routes the
 * user on, or explains what went wrong.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>({ kind: "verifying" });

  useEffect(() => {
    // Read once: query values survive the token exchange; a link error stays in the hash.
    const params: AuthCallbackParams = parseAuthCallbackParams(window.location.search, window.location.hash);
    const recovery = params.type === "recovery";

    if (params.errorCode) {
      setView({
        kind: "link-error",
        message: authLinkErrorMessage(params.errorCode),
        recovery,
        premiumIntent: params.premiumIntent,
      });
      return;
    }
    // A notice without tokens, e.g. the first half of a secure email change. It
    // usually opens where the user is already signed in, so don't wait for (or
    // act on) a session: that would skip straight past the notice.
    if (params.hasMessage) {
      setView({ kind: "message" });
      return;
    }

    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;
    const settle = () => {
      settled = true;
      clearTimeout(timer);
      unsubscribe?.();
    };

    const finish = (isRecovery: boolean) => {
      if (settled) return;
      settle();
      if (isRecovery) {
        markPasswordRecovery();
        const state: RecoveryNavigationState = { recovery: true };
        navigate("/reset-password", { replace: true, state });
        return;
      }
      const premiumIntent = takePremiumIntent() || params.premiumIntent;
      navigate(resolvePostAuthPath({ requested: params.next, premiumIntent }), { replace: true });
    };

    const fail = () => {
      if (settled) return;
      settle();
      setView({ kind: "timeout", recovery, premiumIntent: params.premiumIntent });
    };

    timer = setTimeout(fail, SESSION_TIMEOUT_MS);
    // INITIAL_SESSION fires right away for a new listener. A null one doesn't
    // end the wait; the timeout does.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (settled) return;
      if (event === "PASSWORD_RECOVERY") finish(true);
      else if (session) finish(recovery);
    });
    unsubscribe = () => listener.subscription.unsubscribe();
    if (settled) unsubscribe();

    return settle;
  }, [navigate]);

  if (view.kind === "verifying") {
    return (
      <AuthLayout title="Verifying your link" card={false}>
        <Spinner label="Verifying your link" className="py-8" />
      </AuthLayout>
    );
  }

  if (view.kind === "message") {
    return (
      <AuthLayout
        title="Link confirmed"
        icon={<MailCheck />}
        iconTone="success"
        subtitle="If you're changing your email address, also open the confirmation link we sent to your other address. The change completes once both are confirmed."
        card={false}
      >
        <p className="text-center text-sm">
          <Link to="/app/settings#profile" className={AUTH_LINK_CLASS}>
            Continue to Settings
          </Link>
        </p>
      </AuthLayout>
    );
  }

  const recovery = view.recovery;
  const timedOut = view.kind === "timeout";

  return (
    <AuthLayout
      title={timedOut ? "We couldn't verify your link" : "This link didn't work"}
      icon={timedOut ? <Clock /> : <AlertCircle />}
      iconTone="error"
      subtitle={
        timedOut
          ? "It may have expired, already been used, or been opened in a different browser."
          : view.message
      }
      footer={
        <>
          Still stuck? Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className={AUTH_LINK_CLASS}>
            {SUPPORT_EMAIL}
          </a>
        </>
      }
    >
      {recovery ? (
        <div className="space-y-3 text-center text-sm text-text-secondary">
          <p>Request a fresh password reset link and open it in this browser.</p>
          <Link
            to="/forgot-password"
            className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Request a new reset link
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Confirming your account? Enter your email and we'll send a new confirmation link. If your account is
            already confirmed, just{" "}
            <Link to="/login" className={AUTH_LINK_CLASS}>
              sign in
            </Link>
            .
          </p>
          <ResendConfirmation premiumIntent={view.premiumIntent} />
        </div>
      )}
    </AuthLayout>
  );
}
