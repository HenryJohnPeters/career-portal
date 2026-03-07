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
  Briefcase,
  Sparkles,
  User,
  Crown,
  Check,
  Star,
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

  if (isAuthenticated) {
    navigate("/app/dashboard", { replace: true });
  }

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
        options: {
          data: { name: data.name },
        },
      });
      if (authError) {
        setError(authError.message);
        return;
      }

      // If they chose premium, create a checkout session and redirect to Stripe
      if (data.plan === "premium") {
        try {
          const res = await api.post<{ data: { url: string } }>(
            "/billing/checkout"
          );
          window.location.href = res.data.url;
          return;
        } catch (checkoutErr: any) {
          // If checkout fails, still send them to billing page as fallback
          console.warn(
            "Checkout session failed after signup, redirecting to billing:",
            checkoutErr
          );
          navigate("/app/billing");
          return;
        }
      }

      navigate("/app/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 mb-4">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Create Account
          </h1>
          <p className="text-sm text-blue-200/70 mt-1 flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Start your career journey
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white/[0.07] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 p-7 space-y-5 border border-white/10"
        >
          {/* Plan selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 text-blue-200/80">
              Choose your plan
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Free plan card */}
              <button
                type="button"
                onClick={() => setValue("plan", "free")}
                className={`relative rounded-xl border p-3.5 text-left transition-all duration-200 ${
                  selectedPlan === "free"
                    ? "border-blue-500/60 bg-blue-500/10 ring-1 ring-blue-500/30"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                }`}
              >
                {selectedPlan === "free" && (
                  <div className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <Star className="h-4 w-4 text-blue-300/70 mb-2" />
                <div className="text-sm font-semibold text-white">Free</div>
                <div className="text-xs text-blue-200/50 mt-0.5">
                  £0 / month
                </div>
              </button>

              {/* Premium plan card */}
              <button
                type="button"
                onClick={() => setValue("plan", "premium")}
                className={`relative rounded-xl border p-3.5 text-left transition-all duration-200 ${
                  selectedPlan === "premium"
                    ? "border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                }`}
              >
                {selectedPlan === "premium" && (
                  <div className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <Crown className="h-4 w-4 text-amber-400 mb-2" />
                <div className="text-sm font-semibold text-white">Premium</div>
                <div className="text-xs text-amber-300/60 mt-0.5">
                  £9.99 / month
                </div>
              </button>
            </div>
            {selectedPlan === "premium" && (
              <p className="text-[11px] text-amber-300/60 mt-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                You'll be taken to checkout after sign-up
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-blue-200/80">
              Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <User className="h-4 w-4 text-blue-300/50" />
              </div>
              <input
                type="text"
                {...register("name")}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] pl-10 pr-4 py-2.5 text-sm text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="Jane Doe"
              />
            </div>
            {errors.name && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-blue-200/80">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Mail className="h-4 w-4 text-blue-300/50" />
              </div>
              <input
                type="email"
                {...register("email")}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] pl-10 pr-4 py-2.5 text-sm text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-blue-200/80">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Lock className="h-4 w-4 text-blue-300/50" />
              </div>
              <input
                type="password"
                {...register("password")}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] pl-10 pr-4 py-2.5 text-sm text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-blue-200/80">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Lock className="h-4 w-4 text-blue-300/50" />
              </div>
              <input
                type="password"
                {...register("confirmPassword")}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] pl-10 pr-4 py-2.5 text-sm text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className={`w-full !rounded-xl !py-2.5 !shadow-lg !text-sm !font-semibold ${
              selectedPlan === "premium"
                ? "!bg-gradient-to-r !from-amber-500 !to-orange-600 hover:!from-amber-600 hover:!to-orange-700 !shadow-amber-500/25"
                : "!bg-gradient-to-r !from-blue-500 !to-indigo-600 hover:!from-blue-600 hover:!to-indigo-700 !shadow-blue-500/25"
            }`}
            loading={loading}
          >
            {selectedPlan === "premium" ? (
              <>
                <Crown className="h-4 w-4 mr-2" />
                Create Account & Subscribe
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-blue-200/50 mt-5">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
