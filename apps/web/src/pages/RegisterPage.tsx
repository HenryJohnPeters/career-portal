import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase, api } from "@careerportal/web/data-access";
import { useAuth } from "../lib/auth";
import { Button } from "@careerportal/web/ui";
import { useState } from "react";
import {
  Mail,
  Lock,
  AlertCircle,
  Code2,
  Sparkles,
  User,
  Crown,
  Check,
  Star,
  Zap,
  ArrowRight,
} from "lucide-react";

const schema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email required"),
    password: z.string().min(6, "Min 6 characters"),
    confirmPassword: z.string(),
    plan: z.enum(["free", "premium"]),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) navigate("/app/dashboard", { replace: true });

  const initialPlan =
    searchParams.get("plan") === "premium" ? "premium" : "free";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { plan: initialPlan },
  });

  const selectedPlan = watch("plan");

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { name: data.name } },
      });
      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.plan === "premium") {
        try {
          const res = await api.post<{ data: { url: string } }>(
            "/billing/checkout"
          );
          window.location.href = res.data.url;
          return;
        } catch {
          navigate("/app/billing");
          return;
        }
      }
      navigate("/app/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border-2 border-border bg-bg-tertiary pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all";

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* ── Minimal nav ── */}
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

      {/* ── Form centred ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-sm mb-5">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-2">
              Create your account
            </h1>
            <p className="text-sm text-text-secondary">
              Start your career journey today
            </p>
          </div>

          {/* Card */}
          <div className="bg-bg-elevated border border-border rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* ── Plan picker ── */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">
                  Choose Your Plan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Free */}
                  <button
                    type="button"
                    onClick={() => setValue("plan", "free")}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 group ${
                      selectedPlan === "free"
                        ? "border-primary-500 bg-primary-500/5 shadow-sm shadow-primary-500/10"
                        : "border-border bg-bg-tertiary hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    {selectedPlan === "free" && (
                      <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/10 mb-2.5">
                      <Star className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="text-sm font-bold text-text-primary">
                      Free
                    </div>
                    <div className="text-xs text-text-tertiary mt-0.5">
                      £0 / month
                    </div>
                  </button>

                  {/* Premium */}
                  <button
                    type="button"
                    onClick={() => setValue("plan", "premium")}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 group ${
                      selectedPlan === "premium"
                        ? "border-amber-500 bg-amber-500/5 shadow-sm shadow-amber-500/10"
                        : "border-border bg-bg-tertiary hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    {selectedPlan === "premium" && (
                      <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 mb-2.5">
                      <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-sm font-bold text-text-primary">
                      Premium
                    </div>
                    <div className="text-xs text-text-tertiary mt-0.5">
                      £9.99 / month
                    </div>
                  </button>
                </div>

                {selectedPlan === "premium" && (
                  <div className="flex items-center gap-2 mt-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
                    <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                      You'll be taken to checkout after sign-up
                    </p>
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <User className="h-4 w-4 text-text-tertiary" />
                  </div>
                  <input
                    type="text"
                    {...register("name")}
                    className={inputClass}
                    placeholder="Jane Doe"
                  />
                </div>
                {errors.name && (
                  <p className="text-error text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Mail className="h-4 w-4 text-text-tertiary" />
                  </div>
                  <input
                    type="email"
                    {...register("email")}
                    className={inputClass}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-error text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Lock className="h-4 w-4 text-text-tertiary" />
                  </div>
                  <input
                    type="password"
                    {...register("password")}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="text-error text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Lock className="h-4 w-4 text-text-tertiary" />
                  </div>
                  <input
                    type="password"
                    {...register("confirmPassword")}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-error text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Server error */}
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-error shrink-0" />
                  <p className="text-error text-sm font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className={`w-full ${
                  selectedPlan === "premium"
                    ? "!bg-accent-400 hover:!bg-accent-500"
                    : ""
                }`}
              >
                {!loading &&
                  (selectedPlan === "premium" ? (
                    <>
                      <Crown className="h-4 w-4" />
                      Create Account & Subscribe
                    </>
                  ) : (
                    <>
                      Create Free Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ))}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-text-tertiary mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
