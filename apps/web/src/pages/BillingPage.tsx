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

  const { data: statusData, isLoading: statusLoading } =
    useSubscriptionStatus();
  const checkoutMut = useCreateCheckoutSession();
  const portalMut = useCreatePortalSession();

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showCancelBanner, setShowCancelBanner] = useState(false);

  useEffect(() => {
    if (success) {
      setShowSuccessBanner(true);
      // Refresh user data and subscription status after successful checkout
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionStatus });
      // Clear the query param
      const timeout = setTimeout(() => {
        navigate("/app/billing", { replace: true });
      }, 500);
      return () => clearTimeout(timeout);
    }
    if (cancelled) {
      setShowCancelBanner(true);
      const timeout = setTimeout(() => {
        navigate("/app/billing", { replace: true });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [success, cancelled, queryClient, navigate]);

  const handleUpgrade = async () => {
    try {
      const res = await checkoutMut.mutateAsync();
      window.location.href = res.data.url;
    } catch {
      // error handled by mutation
    }
  };

  const handleManage = async () => {
    try {
      const res = await portalMut.mutateAsync();
      window.location.href = res.data.url;
    } catch {
      // error handled by mutation
    }
  };

  const subscription = statusData?.data;
  const periodEnd = subscription?.stripeCurrentPeriodEnd
    ? new Date(subscription.stripeCurrentPeriodEnd)
    : null;

  if (statusLoading) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success banner */}
      {showSuccessBanner && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-5 py-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-300">
              Welcome to Premium! 🎉
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Your subscription is now active. All AI-powered features are
              unlocked.
            </p>
          </div>
        </div>
      )}

      {/* Cancel banner */}
      {showCancelBanner && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-5 py-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Checkout was cancelled. No charges were made. You can upgrade any
            time.
          </p>
        </div>
      )}

      {/* Current plan banner */}
      <Card className="overflow-hidden">
        <div
          className={`px-4 sm:px-6 py-4 sm:py-5 ${
            isPremium ? "bg-accent-50 dark:bg-accent-900/10" : "bg-bg-tertiary"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl ${
                  isPremium
                    ? "bg-accent-400 text-white shadow-sm"
                    : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {isPremium ? (
                  <Crown className="h-5 w-5" />
                ) : (
                  <Star className="h-5 w-5" />
                )}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-text-primary">
                  {isPremium ? "Premium Plan" : "Free Plan"}
                </h2>
                {isPremium && periodEnd && (
                  <p className="text-xs sm:text-sm text-text-secondary">
                    Renews on{" "}
                    {periodEnd.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
                {!isPremium && (
                  <p className="text-xs sm:text-sm text-text-secondary">
                    Upgrade to unlock AI-powered features
                  </p>
                )}
              </div>
            </div>

            {isPremium ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleManage}
                loading={portalMut.isPending}
                className="w-full sm:w-auto"
              >
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                Manage
                <ExternalLink className="h-3 w-3 ml-1.5 opacity-50" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleUpgrade}
                loading={checkoutMut.isPending}
                className="w-full sm:w-auto"
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Upgrade Now
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free tier */}
        <Card className="relative overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-5 w-5 text-text-tertiary" />
              <h3 className="text-lg font-bold text-text-primary">Free</h3>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              Get started with the essentials
            </p>
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-text-primary">
                £0
              </span>
              <span className="text-sm text-text-secondary ml-1">/ month</span>
            </div>
            <ul className="space-y-3 mb-6">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-text-tertiary mt-0.5 shrink-0" />
                  <span className="text-sm text-text-secondary">{f}</span>
                </li>
              ))}
            </ul>
            {!isPremium ? (
              <div className="rounded-lg bg-bg-tertiary py-2.5 text-center text-sm font-medium text-text-secondary border border-border">
                Current Plan
              </div>
            ) : (
              <div className="rounded-lg bg-bg-tertiary py-2.5 text-center text-sm text-text-tertiary">
                —
              </div>
            )}
          </div>
        </Card>

        {/* Premium tier */}
        <Card className="relative overflow-hidden ring-2 ring-accent-400/50 shadow-lg">
          {/* Popular badge */}
          <div className="absolute top-0 right-0">
            <div className="bg-accent-400 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
              Popular
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-5 w-5 text-accent-500" />
              <h3 className="text-lg font-bold text-text-primary">Premium</h3>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              AI-powered tools for your job search
            </p>
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-text-primary">
                £9.99
              </span>
              <span className="text-sm text-text-secondary ml-1">/ month</span>
            </div>
            <ul className="space-y-3 mb-6">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-accent-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-text-primary">{f}</span>
                </li>
              ))}
            </ul>
            {isPremium ? (
              <div className="rounded-lg bg-accent-50 dark:bg-accent-900/20 py-2.5 text-center text-sm font-semibold text-accent-700 dark:text-accent-400 border border-accent-400/20">
                ✓ Current Plan
              </div>
            ) : (
              <Button
                className="w-full !bg-accent-400 hover:!bg-accent-500"
                onClick={handleUpgrade}
                loading={checkoutMut.isPending}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade to Premium
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Trust / FAQ */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-text-tertiary" />
          <h3 className="font-semibold text-text-primary">
            Frequently Asked Questions
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              Can I cancel anytime?
            </h4>
            <p className="text-sm text-text-secondary">
              Yes — cancel with one click from the billing portal. You keep
              Premium access until the end of your paid period.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              What happens when I cancel?
            </h4>
            <p className="text-sm text-text-secondary">
              Your account reverts to Free. All your data stays intact — you
              just lose AI features and premium limits.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              Is my payment secure?
            </h4>
            <p className="text-sm text-text-secondary">
              All payments are processed securely by Stripe. We never see or
              store your card details.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              Can I switch plans?
            </h4>
            <p className="text-sm text-text-secondary">
              Currently we offer Free and Premium. Manage your subscription via
              the Stripe billing portal at any time.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
