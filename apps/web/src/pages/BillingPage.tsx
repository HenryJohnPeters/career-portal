import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, Crown, ExternalLink, Loader2, RefreshCw, Shield, Sparkles, Star } from "lucide-react";
import { PREMIUM_FAIR_USE, PREMIUM_PRICE, isActivePremium } from "@careerportal/shared/types";
import {
  getErrorMessage,
  invalidateUsage,
  isApiError,
  useCreateCheckoutSession,
  useCreatePortalSession,
  useSubscriptionStatus,
} from "@careerportal/web/data-access";
import { Alert, Badge, Button, Card } from "@careerportal/web/ui";
import { useAuth } from "../lib/auth";
import { PlanUsageCard } from "../components/PlanUsageCard";
import { PlanComparison } from "./shared/PlanComparison";
import {
  describeSubscription,
  isCheckoutSessionId,
  isSafeBillingRedirect,
  upgradeLabel,
} from "./billing/billing-status";
import { useCheckoutActivation } from "./billing/useCheckoutActivation";

const SUPPORT_EMAIL = "support@career-repo.com";
/** Query params set by Stripe's redirects and by the sign-up premium intent. */
const ENTRY_PARAMS = ["success", "session_id", "cancelled", "upgrade"] as const;

const supportLink = (
  <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold underline">
    {SUPPORT_EMAIL}
  </a>
);

function isAlreadySubscribedError(error: unknown): boolean {
  return isApiError(error) && error.status === 400 && /active subscription/i.test(error.message);
}

export function BillingPage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Captured once, so cleaning the URL later doesn't restart or cancel anything.
  const [entry] = useState(() => {
    const sessionId = searchParams.get("session_id");
    return {
      success: searchParams.get("success") === "true",
      sessionId: isCheckoutSessionId(sessionId) ? sessionId : null,
      cancelled: searchParams.get("cancelled") === "true",
      upgrade: searchParams.get("upgrade") === "1",
    };
  });

  const statusQuery = useSubscriptionStatus();
  const { refetch: refetchStatus } = statusQuery;
  const status = statusQuery.data?.data;
  const isPremium = status?.isPremium ?? isActivePremium(user);

  const activation = useCheckoutActivation({
    enabled: entry.success,
    sessionId: entry.sessionId,
    refetchStatus: () => refetchStatus().then((result) => result.data?.data),
  });

  const checkout = useCreateCheckoutSession();
  const portal = useCreatePortalSession();
  const [redirecting, setRedirecting] = useState<"checkout" | "portal" | null>(null);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  // Remove Stripe's params once the return has been handled (kept while activation runs, so a reload resumes it).
  const activationSettled = activation.phase !== "confirming";
  useEffect(() => {
    if (!activationSettled || !ENTRY_PARAMS.some((key) => searchParams.has(key))) return;
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const key of ENTRY_PARAMS) next.delete(key);
        return next;
      },
      { replace: true },
    );
  }, [activationSettled, searchParams, setSearchParams]);

  // Keep the signed-in user (header badge, gating) in step with Stripe: at most once per status change.
  const reconciledRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (!status || reconciledRef.current === status.isPremium) return;
    reconciledRef.current = status.isPremium;
    if (status.isPremium !== isActivePremium(user)) {
      void refreshUser();
      void invalidateUsage(queryClient);
    }
  }, [status, user, refreshUser, queryClient]);

  // Back from Stripe via the back button (page restored from the bfcache): re-enable the buttons.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setRedirecting(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const followRedirect = (url: unknown, kind: "checkout" | "portal") => {
    if (!isSafeBillingRedirect(url)) {
      setRedirectError("We couldn't open the secure Stripe page. Please try again.");
      return;
    }
    setRedirecting(kind);
    window.location.assign(url);
  };

  const startCheckout = async () => {
    portal.reset();
    setRedirectError(null);
    try {
      const res = await checkout.mutateAsync();
      followRedirect(res.data.url, "checkout");
    } catch (error) {
      // Stripe can be ahead of our records: refresh so the page shows Premium.
      if (isAlreadySubscribedError(error)) {
        await Promise.all([refetchStatus(), refreshUser(), invalidateUsage(queryClient)]);
      }
    }
  };

  const openPortal = async () => {
    checkout.reset();
    setRedirectError(null);
    try {
      const res = await portal.mutateAsync();
      followRedirect(res.data.url, "portal");
    } catch {
      // Shown below (and as a toast by the global mutation handler).
    }
  };

  const checkoutError =
    checkout.error && !(isPremium && isAlreadySubscribedError(checkout.error)) ? checkout.error : null;
  const actionError =
    redirectError ??
    (checkoutError ? getErrorMessage(checkoutError) : null) ??
    (portal.error ? getErrorMessage(portal.error) : null);

  const summary = status ? describeSubscription(status) : null;
  const ctaLabel = upgradeLabel(status);
  const checkoutBusy = checkout.isPending || redirecting === "checkout";
  const portalBusy = portal.isPending || redirecting === "portal";
  const paymentIssue = status?.paymentIssue ?? false;
  const showUpgradePrompt = entry.upgrade && status !== undefined && !isPremium && !paymentIssue;
  const trialDays = status?.trialEligible ? status.trialDays : 0;

  const upgradeButton = (className = "") => (
    <Button onClick={() => void startCheckout()} loading={checkoutBusy} disabled={portalBusy} className={className}>
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      {ctaLabel}
    </Button>
  );

  const manageButton = (label = "Manage billing") => (
    <Button variant="outline" onClick={() => void openPortal()} loading={portalBusy} disabled={checkoutBusy}>
      <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
      <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
    </Button>
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      {activation.phase !== "idle" && (
        <ActivationBanner
          phase={activation.phase}
          trialing={status?.status === "trialing"}
          onRetry={activation.retry}
        />
      )}

      {entry.cancelled && activation.phase === "idle" && (
        <Alert variant="info" title="Checkout cancelled">
          You haven't been charged. You can upgrade whenever you're ready.
        </Alert>
      )}

      {paymentIssue && (
        <Alert
          variant="error"
          title="There's a problem with your payment"
          action={
            status?.hasBillingAccount ? (
              manageButton("Update payment method")
            ) : (
              <Button size="sm" onClick={() => void startCheckout()} loading={checkoutBusy}>
                Fix payment
              </Button>
            )
          }
        >
          {summary?.detail}
        </Alert>
      )}

      {actionError && (
        <Alert variant="error" title="That didn't work">
          {actionError} If it keeps happening, email {supportLink}.
        </Alert>
      )}

      {showUpgradePrompt && (
        <div className="rounded-2xl border border-accent-300/70 dark:border-accent-700/50 bg-accent-50/70 dark:bg-accent-900/15 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">Finish setting up Premium</p>
            <p className="text-xs text-text-secondary mt-0.5">
              You chose Premium when you signed up. Continue to Stripe's secure checkout to activate it
              {trialDays > 0 ? ` — your first ${trialDays} days are free.` : "."}
            </p>
          </div>
          {upgradeButton("w-full sm:w-auto")}
        </div>
      )}

      {/* Current plan */}
      <section
        aria-labelledby="current-plan-heading"
        className={`rounded-2xl border shadow-sm overflow-hidden ${
          isPremium ? "border-accent-200/70 dark:border-accent-700/40" : "border-border"
        }`}
      >
        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-5 ${
            isPremium ? "bg-accent-50/60 dark:bg-accent-900/10" : "bg-bg-elevated"
          }`}
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              aria-hidden="true"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                isPremium ? "bg-accent-700" : "bg-neutral-200 dark:bg-neutral-700"
              }`}
            >
              {isPremium ? <Crown className="h-5 w-5 text-white" /> : <Star className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />}
            </div>
            <div className="min-w-0">
              <p aria-hidden="true" className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-0.5">
                Current plan
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="current-plan-heading" className="text-base font-bold text-text-primary">
                  <span className="sr-only">Current plan: </span>
                  {summary?.plan ?? (isPremium ? "Premium" : "Free")}
                </h2>
                {summary?.chip && <Badge variant={summary.chip.tone}>{summary.chip.label}</Badge>}
              </div>
              {statusQuery.isPending ? (
                <p className="text-xs text-text-tertiary mt-1">Checking your subscription…</p>
              ) : summary?.detail && !paymentIssue ? (
                <p className="text-xs text-text-secondary mt-1">{summary.detail}</p>
              ) : !isPremium && !paymentIssue ? (
                <p className="text-xs text-text-secondary mt-1">
                  Upgrade for unlimited CVs, cover letters and practice, plus unlimited AI (fair use) on our
                  higher-quality model.
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {!isPremium && !paymentIssue && upgradeButton("w-full sm:w-auto")}
            {status?.hasBillingAccount &&
              manageButton(isPremium && status.cancelAtPeriodEnd ? "Resume or manage" : "Manage billing")}
          </div>
        </div>
        {statusQuery.isError && (
          <div className="border-t border-border bg-bg-elevated px-6 py-4">
            <Alert
              variant="warning"
              action={
                <Button size="sm" variant="outline" onClick={() => void refetchStatus()} loading={statusQuery.isRefetching}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Try again
                </Button>
              }
            >
              We couldn't load your subscription details. {getErrorMessage(statusQuery.error)}
            </Alert>
          </div>
        )}
      </section>

      <PlanUsageCard />

      <section aria-labelledby="compare-plans-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 id="compare-plans-heading" className="text-base font-bold text-text-primary">
              Compare plans
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Premium is {PREMIUM_PRICE.label} a month. Cancel any time and keep Premium until the end of the period
              you've paid for.
            </p>
          </div>
          {!isPremium && !paymentIssue && upgradeButton("w-full sm:w-auto")}
        </div>
        <PlanComparison current={isPremium ? "premium" : "free"} />
      </section>

      <BillingFaq trialDays={trialDays} />
    </div>
  );
}

function ActivationBanner({
  phase,
  trialing,
  onRetry,
}: {
  phase: "confirming" | "active" | "delayed";
  trialing: boolean;
  onRetry: () => void;
}) {
  if (phase === "confirming") {
    return (
      <Alert variant="info" title="Payment received — activating Premium…">
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          We're confirming your subscription with Stripe. This usually takes a few seconds.
        </span>
      </Alert>
    );
  }
  if (phase === "active") {
    return (
      <Alert variant="success" title={trialing ? "Your Premium trial has started" : "Welcome to Premium"}>
        Unlimited CVs, cover letters and practice, all templates and interviewers, and unlimited AI (fair use) are now
        unlocked.
      </Alert>
    );
  }
  return (
    <Alert
      variant="warning"
      title="We're still confirming your payment"
      action={
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Check again
        </Button>
      }
    >
      Stripe hasn't confirmed your subscription yet. This can take a minute, and there's no need to pay again. If
      Premium isn't active within a few minutes, email {supportLink}.
    </Alert>
  );
}

function BillingFaq({ trialDays }: { trialDays: number }) {
  const faqs: { q: string; a: ReactNode }[] = [
    {
      q: "Can I cancel any time?",
      a: "Yes. Open Manage billing to cancel in Stripe's billing portal. You keep Premium until the end of the period you've paid for and won't be charged again.",
    },
    {
      q: "What happens to my data if Premium ends?",
      a: "Nothing is deleted. You move to the Free plan: everything you created stays and stays editable, Free limits apply to new items, and CVs that use a Premium template need a free template to download as PDF.",
    },
    {
      q: "What does \"unlimited (fair use)\" mean?",
      a: `There's no monthly AI allowance to manage on Premium. To keep the service fast for everyone, fair use is up to ${PREMIUM_FAIR_USE.dailyAiActions} AI actions a day and ${PREMIUM_FAIR_USE.monthlyAiActions} a month.`,
    },
    ...(trialDays > 0
      ? [
          {
            q: "How does the free trial work?",
            a: `Your first ${trialDays} days of Premium are free. Cancel before the trial ends and you won't be charged; otherwise it continues at ${PREMIUM_PRICE.label} a month.`,
          },
        ]
      : []),
    {
      q: "Is my payment secure?",
      a: "Payments are handled by Stripe. We never see or store your full card details.",
    },
    {
      q: "Where are my invoices?",
      a: "Manage billing opens Stripe's billing portal, where you can download invoices and update your payment method.",
    },
    {
      q: "Can I get a refund?",
      a: (
        <>
          Your cancellation rights are explained in our{" "}
          <Link to="/terms" className="font-semibold text-primary-700 dark:text-primary-300 hover:underline">
            Terms of Service
          </Link>
          . For anything else, email {supportLink}.
        </>
      ),
    },
  ];

  return (
    <Card className="p-6">
      <section aria-labelledby="billing-faq-heading">
        <h2 id="billing-faq-heading" className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-5">
          <Shield className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
          Frequently asked questions
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {faqs.map(({ q, a }) => (
            <div key={q}>
              <dt className="text-xs font-semibold text-text-primary mb-1.5">{q}</dt>
              <dd className="text-xs text-text-secondary leading-relaxed">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </Card>
  );
}
