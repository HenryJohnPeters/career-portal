import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Check, CheckCircle2, Crown, Lock, Mail, User } from "lucide-react";
import { FREE_TIER, PREMIUM_PRICE } from "@careerportal/shared/types";
import { supabase } from "@careerportal/web/data-access";
import { Alert, Button, PasswordField, TextField } from "@careerportal/web/ui";
import { useAuth } from "../lib/auth";
import { AUTH_LINK_CLASS, AuthLayout } from "./auth/AuthLayout";
import { PasswordRulesList } from "./auth/PasswordRulesList";
import { ResendConfirmation } from "./auth/ResendConfirmation";
import { authErrorMessage } from "./auth/auth-errors";
import {
  APP_HOME_PATH,
  PREMIUM_INTENT_PARAM,
  PREMIUM_INTENT_VALUE,
  UPGRADE_PATH,
  authCallbackUrl,
  forgetPremiumIntent,
  rememberPremiumIntent,
  takePremiumIntent,
} from "./auth/auth-redirect";
import { emailSchema, withPasswordConfirmation } from "./auth/password-rules";

const NAME_MAX_LENGTH = 80;

const schema = withPasswordConfirmation({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name")
    .max(NAME_MAX_LENGTH, `Use ${NAME_MAX_LENGTH} characters or fewer`),
  email: emailSchema,
  plan: z.enum(["free", "premium"]),
});
type FormData = z.infer<typeof schema>;
type Plan = FormData["plan"];

const PLAN_OPTIONS: { value: Plan; title: string; price: string; summary: string }[] = [
  {
    value: "free",
    title: "Free",
    price: "£0 / month",
    summary: `${FREE_TIER.cvVersions} CVs, ${FREE_TIER.monthlyAiActions} AI actions a month, unlimited job tracking`,
  },
  {
    value: "premium",
    title: "Premium",
    price: `${PREMIUM_PRICE.label} / month`,
    summary: "Unlimited CVs and AI (fair use), all templates, Tailor-for-this-job kit",
  },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<{ email: string; premium: boolean } | null>(null);
  const rulesId = useId();

  const initialPlan: Plan = searchParams.get("plan") === "premium" ? "premium" : "free";

  // A signed-in visitor who picked Premium on the landing page goes straight to billing.
  const destinationRef = useRef<string | null>(null);
  const destination = useCallback((plan: Plan) => {
    if (destinationRef.current === null) {
      // Always consumed, so a stored intent never redirects a later sign-in again.
      const storedIntent = takePremiumIntent();
      destinationRef.current = plan === "premium" || storedIntent ? UPGRADE_PATH : APP_HOME_PATH;
    }
    return destinationRef.current;
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate(destination(initialPlan), { replace: true });
  }, [isAuthenticated, navigate, destination, initialPlan]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { plan: initialPlan, name: "", email: "", password: "", confirmPassword: "" },
  });

  const selectedPlan = watch("plan");
  const password = watch("password");

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    const premium = data.plan === "premium";
    // Remembered before sign-up so it survives the email-confirmation round trip on this device.
    if (premium) rememberPremiumIntent();
    else forgetPremiumIntent();

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { name: data.name },
          emailRedirectTo: authCallbackUrl(
            window.location.origin,
            premium ? { [PREMIUM_INTENT_PARAM]: PREMIUM_INTENT_VALUE } : {},
          ),
        },
      });
      if (authError) {
        setError(authErrorMessage(authError, "signUp"));
        return;
      }
      // No session: either a new account waiting for email confirmation, or an
      // existing address (Supabase returns a user without identities and sends
      // nothing). Both get the same screen so it never reveals who has an account.
      if (!authData.session) {
        setSentTo({ email: data.email, premium });
        return;
      }
      // Email confirmation is off: signed in already. Checkout starts from
      // BillingPage once the account has loaded.
      navigate(destination(data.plan), { replace: true });
    } catch (err) {
      setError(authErrorMessage(err, "signUp"));
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <AuthLayout
        title="Check your email"
        icon={<CheckCircle2 />}
        iconTone="success"
        subtitle={
          <>
            If <span className="font-semibold text-text-primary break-all">{sentTo.email}</span> is new to careerRepo,
            we've sent it a confirmation link.
          </>
        }
        footer={
          <button
            type="button"
            onClick={() => {
              setSentTo(null);
              setError(null);
            }}
            className={AUTH_LINK_CLASS}
          >
            Used the wrong email? Go back
          </button>
        }
      >
        <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
          <p>
            Open the link to verify your account
            {sentTo.premium ? ", then continue to checkout to start Premium." : " and get started."} It can take
            a minute to arrive, so check your spam folder too.
          </p>
          <p>
            Already have an account with this email? No new email is sent:{" "}
            <Link to="/login" className={AUTH_LINK_CLASS}>
              sign in
            </Link>{" "}
            or{" "}
            <Link to="/forgot-password" className={AUTH_LINK_CLASS}>
              reset your password
            </Link>
            .
          </p>
          <ResendConfirmation email={sentTo.email} premiumIntent={sentTo.premium} />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free to start. No card needed."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className={AUTH_LINK_CLASS}>
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <fieldset>
          <legend className="label">Choose a plan</legend>
          <div className="grid grid-cols-2 gap-2.5">
            {PLAN_OPTIONS.map((option) => {
              const checked = selectedPlan === option.value;
              const premium = option.value === "premium";
              return (
                <label
                  key={option.value}
                  className={`relative cursor-pointer rounded-xl border p-3.5 text-left transition-all duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-500 ${
                    checked
                      ? premium
                        ? "border-accent-400 bg-accent-50 dark:bg-accent-900/20 ring-1 ring-accent-400/30"
                        : "border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500/30"
                      : "border-border bg-bg-tertiary hover:border-neutral-300 dark:hover:border-neutral-600"
                  }`}
                >
                  <input type="radio" value={option.value} className="sr-only" {...register("plan")} />
                  {checked && (
                    <span
                      aria-hidden="true"
                      className={`absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full ${
                        premium ? "bg-accent-500" : "bg-primary-600"
                      }`}
                    >
                      <Check className="h-2.5 w-2.5 text-white" />
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs font-bold text-text-primary">
                    {premium && <Crown className="h-3 w-3 text-accent-600" aria-hidden="true" />}
                    {option.title}
                  </span>
                  <span className="block text-[11px] text-text-secondary mt-0.5">{option.price}</span>
                  <span className="block text-[11px] leading-snug text-text-tertiary mt-1.5">{option.summary}</span>
                </label>
              );
            })}
          </div>
          {selectedPlan === "premium" && (
            <p className="mt-2.5 rounded-lg bg-accent-50 dark:bg-accent-900/20 border border-accent-200/60 dark:border-accent-700/30 px-3 py-2 text-[11px] font-medium text-accent-800 dark:text-accent-300">
              Confirm your email, then continue to secure checkout. You can cancel any time.
            </p>
          )}
        </fieldset>

        <TextField
          label="Full name"
          autoComplete="name"
          placeholder="Jane Doe"
          maxLength={NAME_MAX_LENGTH}
          icon={<User />}
          error={errors.name?.message}
          {...register("name")}
        />

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
            autoComplete="new-password"
            placeholder="Create a password"
            icon={<Lock />}
            error={errors.password?.message}
            aria-describedby={rulesId}
            {...register("password")}
          />
          <PasswordRulesList id={rulesId} value={password ?? ""} />
        </div>

        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          icon={<Lock />}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {error && <Alert variant="error">{error}</Alert>}

        <Button
          type="submit"
          loading={loading}
          className={`w-full !h-10 !text-sm ${selectedPlan === "premium" ? "!bg-accent-700 hover:!bg-accent-800 focus-visible:!ring-accent-500" : ""}`}
        >
          {selectedPlan === "premium" ? (
            <>
              {!loading && <Crown className="h-4 w-4" aria-hidden="true" />}
              Create account &amp; go Premium
            </>
          ) : (
            <>
              Create free account
              {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </>
          )}
        </Button>

        <p className="text-center text-[11px] leading-relaxed text-text-tertiary">
          By creating an account you agree to our{" "}
          <Link to="/terms" target="_blank" rel="noopener noreferrer" className={AUTH_LINK_CLASS}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" target="_blank" rel="noopener noreferrer" className={AUTH_LINK_CLASS}>
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </AuthLayout>
  );
}
