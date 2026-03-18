import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@careerportal/web/data-access";
import { Button } from "@careerportal/web/ui";
import { useState } from "react";
import {
  Lock,
  AlertCircle,
  Code2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

const schema = z
  .object({
    password: z.string().min(6, "Min 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (updateError) {
        if (updateError.message.includes("same password")) {
          setError(
            "New password must be different from your current password."
          );
        } else {
          setError(updateError.message);
        }
        return;
      }
      setSuccess(true);
      // Auto-redirect after a short delay
      setTimeout(() => navigate("/app/dashboard", { replace: true }), 2500);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col">
        <header className="h-16 bg-bg-secondary/80 backdrop-blur-xl border-b border-border flex items-center px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
              <Code2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-text-primary">
              careerRepo
            </span>
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-3">
              Password updated
            </h1>
            <p className="text-sm text-text-secondary mb-6">
              Your password has been reset successfully. Redirecting you to the
              dashboard…
            </p>
            <Link
              to="/app/dashboard"
              className="text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline"
            >
              Go to dashboard now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <header className="h-16 bg-bg-secondary/80 backdrop-blur-xl border-b border-border flex items-center px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
            <Code2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-text-primary">
            careerRepo
          </span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-sm mb-5">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-2">
              Set new password
            </h1>
            <p className="text-sm text-text-secondary">
              Choose a new password for your account
            </p>
          </div>

          <div className="bg-bg-elevated border border-border rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
                  New Password
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
                    autoFocus
                  />
                </div>
                {errors.password && (
                  <p className="text-error text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Lock className="h-4 w-4 text-text-tertiary" />
                  </div>
                  <input
                    type="password"
                    {...register("confirmPassword")}
                    className="w-full rounded-xl border-2 border-border bg-bg-tertiary pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
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

              {error && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-error shrink-0" />
                  <p className="text-error text-sm font-medium">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" loading={loading}>
                {!loading && "Update Password"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
