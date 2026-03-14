import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@careerportal/web/data-access";
import { useAuth } from "../lib/auth";
import { Button } from "@careerportal/web/ui";
import { useState } from "react";
import {
  Mail,
  Lock,
  AlertCircle,
  Code2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Min 6 characters"),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate("/app/dashboard", { replace: true });
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (authError) {
        setError(authError.message);
      } else {
        navigate("/app/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

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
              Welcome back
            </h1>
            <p className="text-sm text-text-secondary">
              Sign in to continue your career journey
            </p>
          </div>

          {/* Card */}
          <div className="bg-bg-elevated border border-border rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                    className="w-full rounded-xl border-2 border-border bg-bg-tertiary pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
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
                    className="w-full rounded-xl border-2 border-border bg-bg-tertiary pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
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

              {/* Server error */}
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-error shrink-0" />
                  <p className="text-error text-sm font-medium">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" loading={loading}>
                {!loading && (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-text-tertiary mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
            >
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
