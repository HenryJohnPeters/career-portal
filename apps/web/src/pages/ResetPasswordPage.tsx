import { useEffect, useId, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { supabase } from "@careerportal/web/data-access";
import { Alert, Button, PasswordField, Spinner } from "@careerportal/web/ui";
import { useAuth } from "../lib/auth";
import { AUTH_LINK_CLASS, AuthLayout } from "./auth/AuthLayout";
import { PasswordRulesList } from "./auth/PasswordRulesList";
import { authErrorMessage } from "./auth/auth-errors";
import {
  APP_HOME_PATH,
  clearPasswordRecovery,
  hasPasswordRecovery,
  isRecoveryNavigationState,
  markPasswordRecovery,
} from "./auth/auth-redirect";
import { withPasswordConfirmation } from "./auth/password-rules";

const schema = withPasswordConfirmation({});
type FormData = { password: string; confirmPassword: string };

const REDIRECT_DELAY_MS = 2500;

/**
 * "checking" until the session is known. Only a session that came from a
 * password-recovery link may set a password here without the current one;
 * signed-in users are sent to Settings, which asks for it.
 */
type ViewState = "checking" | "ready" | "signed-in" | "invalid" | "done";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [view, setView] = useState<ViewState>("checking");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rulesId = useId();
  const fromRecoveryLink = isRecoveryNavigationState(location.state);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        if (!data.session) setView("invalid");
        else setView(fromRecoveryLink || hasPasswordRecovery() ? "ready" : "signed-in");
      })
      .catch(() => {
        if (active) setView("invalid");
      });

    // A recovery link that lands here directly (not via /auth/callback).
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "PASSWORD_RECOVERY" || !active) return;
      markPasswordRecovery();
      setView("ready");
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [fromRecoveryLink]);

  useEffect(() => {
    if (view !== "done") return;
    const timer = setTimeout(() => navigate(APP_HOME_PATH, { replace: true }), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [view, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { password: "", confirmPassword: "" } });
  const password = watch("password");

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: data.password });
      if (updateError) {
        setError(authErrorMessage(updateError, "updatePassword"));
        return;
      }
      clearPasswordRecovery();
      setView("done");
    } catch (err) {
      setError(authErrorMessage(err, "updatePassword"));
    } finally {
      setLoading(false);
    }
  };

  const signOutAndReset = async () => {
    setSigningOut(true);
    const signedOut = await logout({ redirectTo: "/forgot-password" });
    if (!signedOut) setSigningOut(false);
  };

  if (view === "checking") {
    return (
      <AuthLayout title="Set a new password" card={false}>
        <Spinner label="Checking your reset link" className="py-8" />
      </AuthLayout>
    );
  }

  if (view === "done") {
    return (
      <AuthLayout
        title="Password updated"
        icon={<CheckCircle2 />}
        iconTone="success"
        subtitle="Your new password is set. Taking you to your dashboard…"
        card={false}
      >
        <p className="text-center">
          <Link to={APP_HOME_PATH} replace className={`text-sm ${AUTH_LINK_CLASS}`}>
            Go to dashboard now
          </Link>
        </p>
      </AuthLayout>
    );
  }

  if (view === "invalid") {
    return (
      <AuthLayout
        title="This reset link isn't valid"
        icon={<AlertCircle />}
        iconTone="error"
        subtitle="It may have expired or already been used. Reset links work once."
        card={false}
      >
        <div className="flex flex-col items-center gap-3">
          <Link
            to="/forgot-password"
            className="inline-flex h-10 items-center rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Request a new reset link
          </Link>
          <Link to="/login" className={`text-xs ${AUTH_LINK_CLASS}`}>
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (view === "signed-in") {
    return (
      <AuthLayout
        title="You're already signed in"
        icon={<UserCheck />}
        iconTone="info"
        subtitle="Change your password in Settings, where we'll ask for your current one."
        card={false}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Link
            to="/app/settings#security"
            className="inline-flex h-10 items-center rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Go to Settings
          </Link>
          <p className="text-xs text-text-secondary">
            Forgot your current password?{" "}
            <button type="button" onClick={() => void signOutAndReset()} disabled={signingOut} className={AUTH_LINK_CLASS}>
              {signingOut ? "Signing out…" : "Sign out and reset it by email"}
            </button>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a new password for your account" icon={<ShieldCheck />}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <PasswordField
            label="New password"
            autoComplete="new-password"
            autoFocus
            icon={<Lock />}
            error={errors.password?.message}
            aria-describedby={rulesId}
            {...register("password")}
          />
          <PasswordRulesList id={rulesId} value={password ?? ""} />
        </div>
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          icon={<Lock />}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" className="w-full !h-10 !text-sm" loading={loading}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
