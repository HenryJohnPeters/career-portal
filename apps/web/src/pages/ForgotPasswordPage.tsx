import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@careerportal/web/data-access";
import { Button } from "@careerportal/web/ui";
import { useState } from "react";
import {
  Mail,
  AlertCircle,
  Code2,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

const schema = z.object({
  email: z.string().email("Valid email required"),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

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
      const siteUrl = window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        { redirectTo: `${siteUrl}/auth/callback?type=recovery` }
      );
      if (resetError) {
        if (resetError.message.includes("Too many requests")) {
          setError("Too many attempts. Please wait a moment and try again.");
        } else {
          setError(resetError.message);
        }
        return;
      }
      setSentEmail(data.email);
      setEmailSent(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
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
              Career Portal
            </span>
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-3">
              Check your email
            </h1>
            <p className="text-sm text-text-secondary mb-2">
              We've sent a password reset link to
            </p>
            <p className="text-sm font-semibold text-text-primary mb-6">
              {sentEmail}
            </p>

            <div className="bg-bg-elevated border border-border rounded-2xl shadow-lg p-6 mb-6">
              <p className="text-sm text-text-secondary">
                Click the link in the email to reset your password. It may take
                a minute to arrive — check your spam folder if you don't see it.
              </p>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
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
            Career Portal
          </span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-sm mb-5">
              <KeyRound className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-2">
              Reset your password
            </h1>
            <p className="text-sm text-text-secondary">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <div className="bg-bg-elevated border border-border rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                    autoFocus
                  />
                </div>
                {errors.email && (
                  <p className="text-error text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.email.message}
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
                {!loading && "Send Reset Link"}
              </Button>
            </form>
          </div>

          <p className="text-center mt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
