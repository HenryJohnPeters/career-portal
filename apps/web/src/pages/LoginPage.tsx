import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { consumeSignOutReason, supabase } from "@careerportal/web/data-access";
import { Alert, Button, PasswordField, TextField } from "@careerportal/web/ui";
import { useAuth } from "../lib/auth";
import { AUTH_LINK_CLASS, AuthLayout } from "./auth/AuthLayout";
import { ResendConfirmation } from "./auth/ResendConfirmation";
import { authErrorMessage, isEmailNotConfirmedError } from "./auth/auth-errors";
import { resolvePostAuthPath, takePremiumIntent } from "./auth/auth-redirect";
import { emailSchema } from "./auth/password-rules";

const schema = z.object({
  email: emailSchema,
  // Only "entered": the policy is enforced when passwords are set, not at sign-in.
  password: z.string().min(1, "Enter your password"),
});
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState<string | null>(null);
  const [signOutReason, setSignOutReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ProtectedRoute passes the page the user wanted as `state.from`; links may use `?next=`.
  const requested = (location.state as { from?: unknown } | null)?.from ?? searchParams.get("next");
  // Resolved once per visit, so the one-time premium intent is not consumed twice.
  const destinationRef = useRef<string | null>(null);
  const destination = useCallback(() => {
    destinationRef.current ??= resolvePostAuthPath({ requested, premiumIntent: takePremiumIntent() });
    return destinationRef.current;
  }, [requested]);

  useEffect(() => {
    if (isAuthenticated) navigate(destination(), { replace: true });
  }, [isAuthenticated, navigate, destination]);

  // Set when the API signed the user out (e.g. a session that could not be refreshed).
  useEffect(() => {
    const reason = consumeSignOutReason();
    if (reason) setSignOutReason(reason);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setNeedsConfirmation(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (authError) {
        if (isEmailNotConfirmedError(authError)) setNeedsConfirmation(data.email);
        setError(authErrorMessage(authError, "signIn"));
        return;
      }
      navigate(destination(), { replace: true });
    } catch (err) {
      setError(authErrorMessage(err, "signIn"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your job search"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className={AUTH_LINK_CLASS}>
            Create one free
          </Link>
        </>
      }
    >
      {signOutReason && (
        <Alert variant="warning" title="You've been signed out" className="mb-5">
          {signOutReason}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<Mail />}
          error={errors.email?.message}
          {...register("email")}
        />

        <div>
          <PasswordField
            label="Password"
            autoComplete="current-password"
            placeholder="Your password"
            icon={<Lock />}
            error={errors.password?.message}
            {...register("password")}
          />
          <p className="mt-1.5 text-right">
            <Link to="/forgot-password" className={`text-xs ${AUTH_LINK_CLASS}`}>
              Forgot password?
            </Link>
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {needsConfirmation && (
          <div className="text-center">
            <ResendConfirmation email={needsConfirmation} />
          </div>
        )}

        <Button type="submit" className="w-full !h-10 !text-sm" loading={loading}>
          Sign in
          {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </Button>
      </form>
    </AuthLayout>
  );
}
