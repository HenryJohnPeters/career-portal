import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Clock, LogIn, MailCheck } from "lucide-react";
import { isAuthRetryableFetchError, type AuthError } from "@supabase/supabase-js";
import { authUrlAtLoad, supabase } from "@careerportal/web/data-access";
import { Spinner } from "@careerportal/web/ui";
import { AUTH_LINK_CLASS, AuthLayout } from "./auth/AuthLayout";
import { ResendConfirmation } from "./auth/ResendConfirmation";
import { SUPPORT_EMAIL, authLinkErrorMessage } from "./auth/auth-errors";
import {
  markPasswordRecovery,
  parseAuthCallbackParams,
  rememberPremiumIntent,
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
  | { kind: "other-browser"; recovery: boolean; next: string | null }
  | { kind: "message" };

function exchangeErrorCode(error: AuthError): string {
  if (isAuthRetryableFetchError(error)) return "network";
  return error.code ?? "unknown";
}

/**
 * Landing page for Supabase email links (sign-up confirmation, password
 * recovery, email change). With the PKCE flow the Supabase client exchanges
 * the link's `?code=` for a session while the app starts, and only in the
 * browser that asked for the link. This page waits for that exchange, then
 * routes the user on, or explains what went wrong.
 *
 * It never acts on a session that already existed: a link signs someone in
 * only when this page load carried a code the client could redeem.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>({ kind: "verifying" });

  useEffect(() => {
    // Read once: query values survive the code exchange; a link error stays in the hash.
    const params: AuthCallbackParams = parseAuthCallbackParams(window.location.search, window.location.hash);
    // `type` comes from the URL, so anyone can set it: it only picks wording.
    const recoveryHint = params.type === "recovery";
    // Only the URL this page was loaded with can carry the email link's code.
    const link = authUrlAtLoad.pathname === window.location.pathname ? authUrlAtLoad : null;

    if (params.errorCode) {
      setView({
        kind: "link-error",
        message: authLinkErrorMessage(params.errorCode),
        recovery: recoveryHint,
        premiumIntent: params.premiumIntent,
      });
      return;
    }
    // A notice without a code, e.g. the first half of a secure email change. It
    // usually opens where the user is already signed in, so don't wait for (or
    // act on) a session: that would skip straight past the notice.
    if (params.hasMessage) {
      setView({ kind: "message" });
      return;
    }

    if (link?.code !== "redeemable") {
      if (link && (link.code === "foreign" || link.implicitTokens)) {
        // Supabase has verified the link, but it can't sign the user in here:
        // it was opened in another browser, or used the token-in-URL flow.
        if (params.premiumIntent) rememberPremiumIntent();
        setView({ kind: "other-browser", recovery: recoveryHint, next: params.next });
      } else {
        setView({
          kind: "link-error",
          message: authLinkErrorMessage(null),
          recovery: recoveryHint,
          premiumIntent: params.premiumIntent,
        });
      }
      return;
    }

    const recovery = link.recovery;
    let active = true;
    const stop = () => {
      active = false;
      clearTimeout(timer);
    };

    const finish = () => {
      stop();
      if (recovery) {
        markPasswordRecovery();
        const state: RecoveryNavigationState = { recovery: true };
        navigate("/reset-password", { replace: true, state });
        return;
      }
      const premiumIntent = takePremiumIntent() || params.premiumIntent;
      navigate(resolvePostAuthPath({ requested: params.next, premiumIntent }), { replace: true });
    };

    const fail = () => {
      if (!active) return;
      stop();
      setView({ kind: "timeout", recovery, premiumIntent: params.premiumIntent });
    };

    const timer = setTimeout(fail, SESSION_TIMEOUT_MS);
    // initialize() resolves once the client has tried the code (the same
    // promise every time, so a StrictMode re-run doesn't exchange it twice).
    void (async () => {
      const { error } = await supabase.auth.initialize();
      if (!active) return;
      if (error) {
        stop();
        setView({
          kind: "link-error",
          message: authLinkErrorMessage(exchangeErrorCode(error)),
          recovery,
          premiumIntent: params.premiumIntent,
        });
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) finish();
      else fail();
    })().catch(fail);

    return stop;
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

  if (view.kind === "other-browser" && !view.recovery) {
    const loginPath = view.next ? `/login?next=${encodeURIComponent(view.next)}` : "/login";
    return (
      <AuthLayout
        title="Sign in to continue"
        icon={<MailCheck />}
        iconTone="success"
        subtitle="If you were confirming your email address, it's confirmed now. For your security, email links only sign you in on the browser where you asked for them, so please sign in here."
        card={false}
      >
        <Link
          to={loginPath}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          Sign in
        </Link>
      </AuthLayout>
    );
  }

  const recovery = view.recovery;
  const timedOut = view.kind === "timeout";
  const otherBrowser = view.kind === "other-browser";
  const premiumIntent = view.kind === "other-browser" ? false : view.premiumIntent;

  return (
    <AuthLayout
      title={
        otherBrowser
          ? "Open the link in the same browser"
          : timedOut
            ? "We couldn't verify your link"
            : "This link didn't work"
      }
      icon={timedOut || otherBrowser ? <Clock /> : <AlertCircle />}
      iconTone="error"
      subtitle={
        otherBrowser
          ? "For your security, a password reset link only works in the browser you requested it from."
          : timedOut
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
          <ResendConfirmation premiumIntent={premiumIntent} />
        </div>
      )}
    </AuthLayout>
  );
}
