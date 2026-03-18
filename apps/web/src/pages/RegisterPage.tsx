import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase, api } from "@careerportal/web/data-access";
import { useAuth } from "../lib/auth";
import { Button } from "@careerportal/web/ui";
import { useState, useEffect } from "react";
import {
  Mail, Lock, AlertCircle, Code2, User, Crown,
  Check, Zap, ArrowRight, CheckCircle2, Eye, EyeOff,
} from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Min 6 characters"),
  confirmPassword: z.string(),
  plan: z.enum(["free", "premium"]),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

function friendlyError(msg: string): string {
  if (msg.includes("User already registered")) return "An account with this email already exists.";
  if (msg.includes("Password should be at least")) return "Password must be at least 6 characters.";
  if (msg.includes("Too many requests")) return "Too many attempts. Please wait and try again.";
  return msg;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/app/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const initialPlan = searchParams.get("plan") === "premium" ? "premium" : "free";

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { plan: initialPlan },
  });

  const selectedPlan = watch("plan");

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      const siteUrl = window.location.origin;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { name: data.name }, emailRedirectTo: `${siteUrl}/auth/callback` },
      });
      if (authError) { setError(friendlyError(authError.message)); return; }
      if (authData.user?.identities?.length === 0) {
        setError("An account with this email already exists. Try signing in instead.");
        return;
      }
      if (!authData.session) {
        setRegisteredEmail(data.email);
        setEmailSent(true);
        return;
      }
      if (data.plan === "premium") {
        try {
          const res = await api.post<{ data: { url: string } }>("/billing/checkout");
          window.location.href = res.data.url;
          return;
        } catch { navigate("/app/billing"); return; }
      }
      navigate("/app/dashboard");
    } catch { setError("An unexpected error occurred."); }
    finally { setLoading(false); }
  };

  const handleResendConfirmation = async () => {
    if (!registeredEmail) return;
    setLoading(true);
    try {
      const siteUrl = window.location.origin;
      const { error } = await supabase.auth.resend({ type: "signup", email: registeredEmail, options: { emailRedirectTo: `${siteUrl}/auth/callback` } });
      if (error) setError(friendlyError(error.message));
    } finally { setLoading(false); }
  };

  const inputClass = "input-base input-icon";

  // ── Email sent screen ──
  if (emailSent) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col">
        <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />
        <header className="relative z-10 h-14 flex items-center px-6 border-b border-border/50">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 shadow-sm"><Code2 className="h-3.5 w-3.5 text-white" /></div>
            <span className="text-sm font-bold tracking-tight text-text-primary">careerRepo</span>
          </Link>
        </header>
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-200 dark:ring-emerald-800/50 mb-6">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary mb-2">Check your email</h1>
            <p className="text-sm text-text-tertiary mb-1">We sent a confirmation link to</p>
            <p className="text-sm font-semibold text-text-primary mb-7">{registeredEmail}</p>
            <div className="bg-bg-elevated border border-border rounded-2xl shadow-sm p-6 mb-6 text-left">
              <p className="text-sm text-text-secondary leading-relaxed mb-4">Click the link in the email to verify your account and get started. It may take a minute — check your spam folder if needed.</p>
              <button onClick={handleResendConfirmation} disabled={loading} className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50">
                {loading ? "Sending…" : "Resend confirmation email"}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 px-4 py-3 mb-4">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}
            <button onClick={() => { setEmailSent(false); setRegisteredEmail(""); setError(null); }} className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              Wrong email? Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />
      <header className="relative z-10 h-14 flex items-center px-6 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 shadow-sm"><Code2 className="h-3.5 w-3.5 text-white" /></div>
          <span className="text-sm font-bold tracking-tight text-text-primary">careerRepo</span>
        </Link>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary mb-1.5">Create your account</h1>
            <p className="text-sm text-text-tertiary">Start your career journey today — it's free</p>
          </div>

          <div className="bg-bg-elevated rounded-2xl border border-border shadow-lg p-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Plan picker */}
              <div>
                <label className="label">Choose plan</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button type="button" onClick={() => setValue("plan", "free")}
                    className={`relative rounded-xl border p-3.5 text-left transition-all duration-150 ${
                      selectedPlan === "free"
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500/30"
                        : "border-border bg-bg-tertiary hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}>
                    {selectedPlan === "free" && (
                      <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                    <p className="text-xs font-bold text-text-primary">Free</p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">£0 / month</p>
                  </button>
                  <button type="button" onClick={() => setValue("plan", "premium")}
                    className={`relative rounded-xl border p-3.5 text-left transition-all duration-150 ${
                      selectedPlan === "premium"
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-400/30"
                        : "border-border bg-bg-tertiary hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}>
                    {selectedPlan === "premium" && (
                      <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                    <div className="flex items-center gap-1 mb-0.5">
                      <Crown className="h-3 w-3 text-amber-500" />
                      <p className="text-xs font-bold text-text-primary">Premium</p>
                    </div>
                    <p className="text-[11px] text-text-tertiary">£9.99 / month</p>
                  </button>
                </div>
                {selectedPlan === "premium" && (
                  <div className="flex items-center gap-1.5 mt-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/30 px-3 py-2">
                    <Zap className="h-3 w-3 text-amber-500 shrink-0" />
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">You'll be taken to checkout after sign-up</p>
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="label">Full name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
                  <input type="text" {...register("name")} className={inputClass} placeholder="Jane Doe" autoComplete="name" />
                </div>
                {errors.name && <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500 font-medium"><AlertCircle className="h-3 w-3 shrink-0" />{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
                  <input type="email" {...register("email")} className={inputClass} placeholder="you@example.com" autoComplete="email" />
                </div>
                {errors.email && <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500 font-medium"><AlertCircle className="h-3 w-3 shrink-0" />{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
                  <input type={showPassword ? "text" : "password"} {...register("password")} className={`${inputClass} pr-10`} placeholder="Min 6 characters" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500 font-medium"><AlertCircle className="h-3 w-3 shrink-0" />{errors.password.message}</p>}
              </div>

              {/* Confirm password */}
              <div>
                <label className="label">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
                  <input type={showConfirm ? "text" : "password"} {...register("confirmPassword")} className={`${inputClass} pr-10`} placeholder="Repeat password" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500 font-medium"><AlertCircle className="h-3 w-3 shrink-0" />{errors.confirmPassword.message}</p>}
              </div>

              {error && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className={`w-full !h-10 !text-sm ${selectedPlan === "premium" ? "!bg-amber-400 hover:!bg-amber-500 focus:!ring-amber-400" : ""}`}
              >
                {!loading && (selectedPlan === "premium" ? (
                  <><Crown className="h-4 w-4" />Create Account &amp; Subscribe</>
                ) : (
                  <>Create Free Account <ArrowRight className="h-4 w-4" /></>
                ))}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-text-tertiary mt-5">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
