import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@careerportal/web/data-access";
import { useAuth } from "../lib/auth";
import { Button } from "@careerportal/web/ui";
import { useState, useEffect } from "react";
import { Mail, Lock, AlertCircle, Code2, ArrowRight, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Min 6 characters"),
});
type FormData = z.infer<typeof schema>;

function friendlyError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Incorrect email or password.";
  if (msg.includes("Email not confirmed")) return "Please confirm your email first. Check your inbox.";
  if (msg.includes("Too many requests")) return "Too many attempts. Please wait and try again.";
  return msg;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/app/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
      if (authError) { setError(friendlyError(authError.message)); }
      else { navigate("/app/dashboard"); }
    } catch { setError("An unexpected error occurred."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Subtle background */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />

      {/* Nav */}
      <header className="relative z-10 h-14 flex items-center px-6 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
            <Code2 className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-text-primary">careerRepo</span>
        </Link>
      </header>

      {/* Form */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary mb-1.5">Welcome back</h1>
            <p className="text-sm text-text-tertiary">Sign in to continue your career journey</p>
          </div>

          {/* Card */}
          <div className="bg-bg-elevated rounded-2xl border border-border shadow-lg p-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
                  <input
                    type="email"
                    {...register("email")}
                    className="input-base input-icon"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500 font-medium">
                    <AlertCircle className="h-3 w-3 shrink-0" />{errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Password</label>
                  <Link to="/forgot-password" className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="input-base input-icon pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500 font-medium">
                    <AlertCircle className="h-3 w-3 shrink-0" />{errors.password.message}
                  </p>
                )}
              </div>

              {/* Server error */}
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-red-600 dark:text-red-400 text-xs font-medium">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full !h-10 !text-sm" loading={loading}>
                {!loading && <>Sign In <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-text-tertiary mt-5">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
