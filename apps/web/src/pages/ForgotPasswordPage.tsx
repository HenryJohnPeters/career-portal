import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, KeyRound, Mail, MailCheck } from "lucide-react";
import { supabase } from "@careerportal/web/data-access";
import { Alert, Button, TextField } from "@careerportal/web/ui";
import { AUTH_LINK_CLASS, AuthLayout } from "./auth/AuthLayout";
import { authErrorMessage } from "./auth/auth-errors";
import { authCallbackUrl } from "./auth/auth-redirect";
import { emailSchema } from "./auth/password-rules";

const schema = z.object({ email: emailSchema });
type FormData = z.infer<typeof schema>;

/*
 * Only these errors are shown: they don't depend on whether the address has
 * an account. Anything else ends on the same "if an account exists" screen
 * as a success, so the form can't be used to discover who is registered.
 */
const SHOWN_ERROR_CODES = new Set([
  "over_email_send_rate_limit",
  "over_request_rate_limit",
  "email_address_invalid",
  "captcha_failed",
]);

function isShownError(error: { code?: string; status?: number; name?: string }): boolean {
  return (
    SHOWN_ERROR_CODES.has(error.code ?? "") ||
    error.status === 429 ||
    error.status === 0 ||
    error.name === "AuthRetryableFetchError"
  );
}

const backToSignIn = (
  <Link to="/login" className={`inline-flex items-center gap-1.5 ${AUTH_LINK_CLASS}`}>
    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
    Back to sign in
  </Link>
);

export function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: authCallbackUrl(window.location.origin, { type: "recovery" }),
      });
      if (resetError && isShownError(resetError)) {
        setError(authErrorMessage(resetError, "resetRequest"));
        return;
      }
      setSentTo(data.email);
    } catch (err) {
      setError(authErrorMessage(err, "resetRequest"));
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <AuthLayout
        title="Check your email"
        icon={<MailCheck />}
        iconTone="success"
        subtitle={
          <>
            If an account exists for <span className="font-semibold text-text-primary break-all">{sentTo}</span>, we've
            sent it a link to reset your password.
          </>
        }
        footer={backToSignIn}
      >
        <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
          <p>The link works once and expires after a while. It can take a minute to arrive, so check your spam folder too.</p>
          <p>
            Nothing arrived?{" "}
            <button type="button" onClick={() => setSentTo(null)} className={AUTH_LINK_CLASS}>
              Try again
            </button>{" "}
            or check you used the address you signed up with.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
      icon={<KeyRound />}
      footer={backToSignIn}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          autoFocus
          icon={<Mail />}
          error={errors.email?.message}
          {...register("email")}
        />
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" className="w-full !h-10 !text-sm" loading={loading}>
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}
