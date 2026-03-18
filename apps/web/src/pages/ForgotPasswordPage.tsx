import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@careerportal/web/data-access";
import { Button } from "@careerportal/web/ui";
import { useState } from "react";
import { Mail, AlertCircle, Code2, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";

const schema = z.object({ email: z.string().email("Valid email required") });
type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      const siteUrl = window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${siteUrl}/auth/callback?type=recovery`,
      });
      if (resetError) {
        setError(resetError.message.includes("Too many requests")
          ? "Too many attempts. Please wait and try again."
          : resetError.message);
        return;
      }
      setSentEmail(data.email);
      setEmailSent(true);
    } catch { setError("An unexpected error occurred."); }
    finally { setLoading(false); }
  };

  const navBar = (
    <header className="relative z-10 h-14 flex items-center px-6 border-b border-border/50">
      <Link to="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
          <Code2 className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight text-text-primary">Career Portal</span>
      </Link>
    </header>
  );

  if (emailSent) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col">
        <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />
        {navBar}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-200 dark:ring-emerald-800/50 mb-6">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary mb-2">Check your email</h1>
            <p className="text-sm text-text-tertiary mb-1">We sent a password reset link to</p>
            <p className="text-sm font-semibold text-text-primary mb-7">{sentEmail}</p>
            <div className="bg-bg-elevated border border-border rounded-2xl shadow-sm p-6 mb-7">
              <p className="text-sm text-text-secondary leading-relaxed">
                Click the link in the email to reset your password. It may take a minute to arrive — check your spam folder if you don't see it.
              </p>
            </div>
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" />Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />
      {navBar}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 shadow-sm mb-5">
              <KeyRound className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary mb-1.5">Reset your password</h1>
            <p className="text-sm text-text-tertiary">Enter your email and we'll send you a reset link</p>
          </div>

          <div className="bg-bg-elevated rounded-2xl border border-border shadow-lg p-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
                  <input
                    type="email"
                    {...register("email")}
                    className="input-base input-icon"
                    placeholder="you@example.com"
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500 font-medium">
                    <AlertCircle className="h-3 w-3 shrink-0" />{errors.email.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full !h-10 !text-sm" loading={loading}>
                {!loading && "Send Reset Link"}
              </Button>
            </form>
          </div>

          <p className="text-center mt-5">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" />Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
