import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { isActivePremium, FREE_TIER } from "@careerportal/shared/types";
import {
  useSubscriptionStatus,
  useCreateCheckoutSession,
  useVerifyCheckoutSession,
  useCreatePortalSession,
  queryKeys,
} from "@careerportal/web/data-access";
import { Button, Card, Spinner } from "@careerportal/web/ui";
import {
  Crown,
  Check,
  Sparkles,
  CreditCard,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Shield,
  Zap,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const FREE_FEATURES = [
  `CV Builder — ${FREE_TIER.cvVersions} CV version`,
  `Cover Letter Editor — ${FREE_TIER.coverLetters} letters`,
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
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isPremium = isActivePremium(user);

  const success = searchParams.get("success") === "true";
  const cancelled = searchParams.get("cancelled") === "true";
  const checkoutSessionId = searchParams.get("session_id");

  const { data: statusData, isLoading: statusLoading } =
    useSubscriptionStatus();
  const checkoutMut = useCreateCheckoutSession();
  const { mutate: verifyCheckout } = useVerifyCheckoutSession();
  const portalMut = useCreatePortalSession();

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showCancelBanner, setShowCancelBanner] = useState(false);

  // After Stripe checkout success, poll until the webhook has activated premium.
  // The Stripe redirect arrives before the webhook fires, so we poll briefly.
  useEffect(() => {
    let isCancelled = false;

    if (success) {
      setShowSuccessBanner(true);
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionStatus });
      queryClient.invalidateQueries({ queryKey: queryKeys.aiUsage });

      if (checkoutSessionId) {
        verifyCheckout(checkoutSessionId);
      }

      // Poll user status for up to 15 seconds to wait for webhook
      let attempts = 0;
      const poll = setInterval(async () => {
        if (isCancelled) {
          clearInterval(poll);
          return;
        }
        attempts++;
        await refreshUser();
        queryClient.invalidateQueries({
          queryKey: queryKeys.subscriptionStatus,
        });
        if (attempts >= 5) clearInterval(poll);
      }, 3000);

      const t = setTimeout(
        () => navigate("/app/billing", { replace: true }),
        500,
      );
      return () => {
        isCancelled = true;
        clearTimeout(t);
        clearInterval(poll);
      };
    }
    if (cancelled) {
      setShowCancelBanner(true);
      const t = setTimeout(
        () => navigate("/app/billing", { replace: true }),
        500,
      );
      return () => clearTimeout(t);
    }
  }, [
    success,
    cancelled,
    checkoutSessionId,
    verifyCheckout,
    queryClient,
    navigate,
    refreshUser,
  ]);

  const handleUpgrade = async () => {
    try {
      const res = await checkoutMut.mutateAsync();
      window.location.href = res.data.url;
    } catch {
      /* handled by mutation */
    }
  };

  const handleManage = async () => {
    try {
      const res = await portalMut.mutateAsync();
      window.location.href = res.data.url;
    } catch {
      /* handled by mutation */
    }
  };

  const subscription = statusData?.data;
  const periodEnd = subscription?.stripeCurrentPeriodEnd
    ? new Date(subscription.stripeCurrentPeriodEnd)
    : null;
  const premiumConfirmed = subscription?.isPremium ?? isPremium;

  if (statusLoading) return <Spinner />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      {/* Success banner */}
      {showSuccessBanner && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/60 px-5 py-4 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              {premiumConfirmed
                ? "Welcome to Premium! 🎉"
                : "Payment received. Finalising your subscription..."}
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
              {premiumConfirmed
                ? "Your subscription is active. All AI features are now unlocked."
                : "We are confirming your billing status with Stripe. This usually takes a few seconds."}
            </p>
          </div>
        </div>
      )}

      {/* Cancelled banner */}
      {showCancelBanner && (
        <div className="flex items-center gap-3 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800/60 px-5 py-4 animate-fade-in">
          <XCircle className="h-5 w-5 text-accent-500 shrink-0" />
          <p className="text-xs text-accent-700 dark:text-accent-300">
            Checkout was cancelled. No charges were made. You can upgrade any
            time.
          </p>
        </div>
      )}

      {/* Current plan card */}
      <div
        className={`rounded-2xl border shadow-sm overflow-hidden ${isPremium ? "border-accent-200/70 dark:border-accent-700/40" : "border-border"}`}
      >
        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-5 ${isPremium ? "bg-accent-50/60 dark:bg-accent-900/10" : "bg-bg-elevated"}`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${isPremium ? "bg-accent-400" : "bg-neutral-200 dark:bg-neutral-700"}`}
            >
              {isPremium ? (
                <Crown className="h-5 w-5 text-white" />
              ) : (
                <Star className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-0.5">
                Current plan
              </p>
              <h2 className="text-base font-bold text-text-primary">
                {isPremium ? "Premium" : "Free"}
              </h2>
              {isPremium && periodEnd && (
                <p className="text-xs text-text-secondary mt-0.5">
                  Renews{" "}
                  {periodEnd.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
              {!isPremium && (
                <p className="text-xs text-text-tertiary mt-0.5">
                  Upgrade to unlock AI-powered features
                </p>
              )}
            </div>
          </div>
          {isPremium ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManage}
              loading={portalMut.isPending}
              className="w-full sm:w-auto"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Manage subscription
              <ExternalLink className="h-3 w-3 opacity-50" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleUpgrade}
              loading={checkoutMut.isPending}
              className="w-full sm:w-auto"
            >
              <Zap className="h-3.5 w-3.5" />
              Upgrade to Premium
            </Button>
          )}
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free */}
        <div
          className={`rounded-2xl border bg-bg-elevated shadow-sm p-6 ${!isPremium ? "border-primary-200 dark:border-primary-800/60 ring-1 ring-primary-500/20" : "border-border"}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-text-tertiary" />
            <h3 className="text-sm font-bold text-text-primary">Free</h3>
            {!isPremium && (
              <span className="ml-auto text-[10px] font-bold uppercase tracking-widest bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-0.5 rounded-md ring-1 ring-primary-200/60 dark:ring-primary-700/30">
                Current
              </span>
            )}
          </div>
          <p className="text-xs text-text-tertiary mb-5">
            Get started with the essentials
          </p>
          <div className="mb-6">
            <span className="text-3xl font-extrabold tracking-tight text-text-primary">
              £0
            </span>
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
        <div
          className={`relative rounded-2xl border bg-bg-elevated shadow-sm p-6 ${isPremium ? "border-accent-300/70 dark:border-accent-700/50 ring-1 ring-accent-400/20" : "border-accent-200/70 dark:border-accent-700/30"}`}
        >
          {/* Badge */}
          <div className="absolute -top-px -right-px">
            <div className="bg-accent-400 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-2xl">
              Popular
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-4 w-4 text-accent-500" />
            <h3 className="text-sm font-bold text-text-primary">Premium</h3>
            {isPremium && (
              <span className="ml-auto text-[10px] font-bold uppercase tracking-widest bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400 px-2 py-0.5 rounded-md ring-1 ring-accent-200/60 dark:ring-accent-700/30">
                Current
              </span>
            )}
          </div>
          <p className="text-xs text-text-tertiary mb-5">
            AI-powered tools for your job search
          </p>
          <div className="mb-6">
            <span className="text-3xl font-extrabold tracking-tight text-text-primary">
              £9.99
            </span>
            <span className="text-xs text-text-tertiary ml-1">/ month</span>
          </div>
          <ul className="space-y-2.5 mb-6">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-accent-500 mt-0.5 shrink-0" />
                <span className="text-xs text-text-primary">{f}</span>
              </li>
            ))}
          </ul>
          {isPremium ? (
            <div className="rounded-lg bg-accent-50 dark:bg-accent-900/20 border border-accent-200/60 dark:border-accent-700/30 py-2 text-center text-xs font-semibold text-accent-700 dark:text-accent-400">
              ✓ Active plan
            </div>
          ) : (
            <Button
              className="w-full !bg-accent-400 hover:!bg-accent-500 focus:!ring-accent-400"
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
          <h3 className="text-sm font-semibold text-text-primary">
            Frequently Asked Questions
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {[
            {
              q: "Can I cancel anytime?",
              a: "Yes — cancel with one click from the billing portal. You keep Premium access until the end of your paid period.",
            },
            {
              q: "What happens when I cancel?",
              a: "Your account reverts to Free. All your data stays intact — you just lose AI features and premium limits.",
            },
            {
              q: "Is my payment secure?",
              a: "All payments are processed securely by Stripe. We never see or store your card details.",
            },
            {
              q: "Can I switch plans?",
              a: "Currently we offer Free and Premium. Manage your subscription via the Stripe billing portal at any time.",
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <h4 className="text-xs font-semibold text-text-primary mb-1.5">
                {q}
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
