import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
  useSubscriptionStatus,
  useCreateCheckoutSession,
  useCreatePortalSession,
  queryKeys,
} from "@careerportal/web/data-access";
import { Button, Card, Spinner } from "@careerportal/web/ui";
import {
  Crown, Check, Sparkles, CreditCard, ArrowRight,
  ExternalLink, CheckCircle2, XCircle, Shield, Zap, Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const FREE_FEATURES = [
  "CV Builder — 1 CV version",
  "Cover Letter Editor — 2 letters",
  "Job Tracker — Kanban board",
  "Basic templates",
];

const PREMIUM_FEATURES = [
  "Unlimited CV versions",
  "Unlimited cover letters",
  "All premium templates",
  "AI-powered CV rewriting",
  "AI cover letter generation",
  "AI job description analysis",
  "AI interview prep & scoring",
  "Priority support",
];

export function BillingPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isPremium = user?.isPremium ?? false;

  const success = searchParams.get("success") === "true";
  const cancelled = searchParams.get("cancelled") === "true";

  const { data: statusData, isLoading: statusLoading } = useSubscriptionStatus();
  const checkoutMut = useCreateCheckoutSession();
  const portalMut = useCreatePortalSession();

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showCancelBanner, setShowCancelBanner] = useState(false);

  useEffect(() => {
    if (success) {
      setShowSuccessBanner(true);
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionStatus });
      const t = setTimeout(() => navigate("/app/billing", { replace: true }), 500);
      return () => clearTimeout(t);
    }
    if (cancelled) {
      setShowCancelBanner(true);
      const t = setTimeout(() => navigate("/app/billing", { replace: true }), 500);
      return () => clearTimeout(t);
    }
  }, [success, cancelled, queryClient, navigate]);

  const handleUpgrade = async () => {
    try {
      const res = await checkoutMut.mutateAsync();
      window.location.href = res.data.url;
    } catch { /* handled by mutation */ }
  };

  const handleManage = async () => {
    try {
      const res = await portalMut.mutateAsync();
      window.location.href = res.data.url;
    } catch { /* handled by mutation */ }
  };

  const subscription = statusData?.data;
  const periodEnd = subscription?.stripeCurrentPeriodEnd
    ? new Date(subscription.stripeCurrentPeriodEnd)
    : null;

  if (statusLoading) return <Spinner />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">

      {/* Success banner */}
      {showSuccessBanner && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/60 px-5 py-4 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Welcome to Premium! 🎉</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Your subscription is active. All AI features are now unlocked.</p>
          </div>
        </div>
      )}

      {/* Cancelled banner */}
      {showCancelBanner && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 px-5 py-4 animate-fade-in">
          <XCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">Checkout was cancelled. No charges were made. You can upgrade any time.</p>
        </div>
      )}

      {/* Current plan card */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${isPremium ? "border-amber-200/70 dark:border-amber-700/40" : "border-border"}`}>
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-5 ${isPremium ? "bg-amber-50/60 dark:bg-amber-900/10" : "bg-bg-elevated"}`}>
          <div className="flex items-center gap-3.5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${isPremium ? "bg-amber-400" : "bg-neutral-200 dark:bg-neutral-700"}`}>
              {isPremium ? <Crown className="h-5 w-5 text-white" /> : <Star className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-0.5">Current plan</p>
              <h2 className="text-base font-bold text-text-primary">{isPremium ? "Premium" : "Free"}</h2>
              {isPremium && periodEnd && (
                <p className="text-xs text-text-secondary mt-0.5">
                  Renews {periodEnd.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
              {!isPremium && <p className="text-xs text-text-tertiary mt-0.5">Upgrade to unlock AI-powered features</p>}
            </div>
          </div>
          {isPremium ? (
            <Button variant="outline" size="sm" onClick={handleManage} loading={portalMut.isPending} className="w-full sm:w-auto">
              <CreditCard className="h-3.5 w-3.5" />Manage subscription
              <ExternalLink className="h-3 w-3 opacity-50" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleUpgrade} loading={checkoutMut.isPending} className="w-full sm:w-auto">
              <Zap className="h-3.5 w-3.5" />Upgrade to Premium
            </Button>
          )}
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free */}
        <div className={`rounded-2xl border bg-bg-elevated shadow-sm p-6 ${!isPremium ? "border-primary-200 dark:border-primary-800/60 ring-1 ring-primary-500/20" : "border-border"}`}>
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-text-tertiary" />
            <h3 className="text-sm font-bold text-text-primary">Free</h3>
            {!isPremium && <span className="ml-auto text-[10px] font-bold uppercase tracking-widest bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-0.5 rounded-md ring-1 ring-primary-200/60 dark:ring-primary-700/30">Current</span>}
          </div>
          <p className="text-xs text-text-tertiary mb-5">Get started with the essentials</p>
          <div className="mb-6">
            <span className="text-3xl font-extrabold tracking-tight text-text-primary">£0</span>
            <span className="text-xs text-text-tertiary ml-1">/ month</span>
          </div>
          <ul className="space-y-2.5 mb-6">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-text-tertiary mt-0.5 shrink-0" />
                <span className="text-xs text-text-secondary">{f}</span>
              </li>
            ))}
          </ul>
          {!isPremium && (
            <div className="rounded-lg bg-bg-tertiary border border-border py-2 text-center text-xs font-medium text-text-tertiary">
              Current plan
            </div>
          )}
        </div>

        {/* Premium */}
        <div className={`relative rounded-2xl border bg-bg-elevated shadow-sm p-6 ${isPremium ? "border-amber-300/70 dark:border-amber-700/50 ring-1 ring-amber-400/20" : "border-amber-200/70 dark:border-amber-700/30"}`}>
          {/* Badge */}
          <div className="absolute -top-px -right-px">
            <div className="bg-amber-400 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-2xl">
              Popular
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-text-primary">Premium</h3>
            {isPremium && <span className="ml-auto text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-md ring-1 ring-amber-200/60 dark:ring-amber-700/30">Current</span>}
          </div>
          <p className="text-xs text-text-tertiary mb-5">AI-powered tools for your job search</p>
          <div className="mb-6">
            <span className="text-3xl font-extrabold tracking-tight text-text-primary">£9.99</span>
            <span className="text-xs text-text-tertiary ml-1">/ month</span>
          </div>
          <ul className="space-y-2.5 mb-6">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-xs text-text-primary">{f}</span>
              </li>
            ))}
          </ul>
          {isPremium ? (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/30 py-2 text-center text-xs font-semibold text-amber-700 dark:text-amber-400">
              ✓ Active plan
            </div>
          ) : (
            <Button
              className="w-full !bg-amber-400 hover:!bg-amber-500 focus:!ring-amber-400"
              onClick={handleUpgrade}
              loading={checkoutMut.isPending}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade to Premium
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-2xl border border-border bg-bg-elevated shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="h-4 w-4 text-text-tertiary" />
          <h3 className="text-sm font-semibold text-text-primary">Frequently Asked Questions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {[
            { q: "Can I cancel anytime?", a: "Yes — cancel with one click from the billing portal. You keep Premium access until the end of your paid period." },
            { q: "What happens when I cancel?", a: "Your account reverts to Free. All your data stays intact — you just lose AI features and premium limits." },
            { q: "Is my payment secure?", a: "All payments are processed securely by Stripe. We never see or store your card details." },
            { q: "Can I switch plans?", a: "Currently we offer Free and Premium. Manage your subscription via the Stripe billing portal at any time." },
          ].map(({ q, a }) => (
            <div key={q}>
              <h4 className="text-xs font-semibold text-text-primary mb-1.5">{q}</h4>
              <p className="text-xs text-text-secondary leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
