import { Suspense, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Code,
  Code2,
  Crown,
  FileText,
  Mail,
  MessagesSquare,
  Sparkles,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { FREE_TIER, PREMIUM_PRICE, isActivePremium } from "@careerportal/shared/types";
import { authUrlAtLoad, supabase } from "@careerportal/web/data-access";
import { useAuth } from "../lib/auth";
import { lazyPage } from "../lib/lazy";
import { useToast } from "../lib/toast";
import {
  UPGRADE_PATH,
  hasPasswordRecovery,
  markPasswordRecovery,
  takePremiumIntent,
  type RecoveryNavigationState,
} from "./auth/auth-redirect";
import { PREMIUM_CTA, PRIMARY_CTA, SECONDARY_CTA } from "./landing/cta-styles";
import { PricingFallback, SectionBoundary } from "./landing/SectionBoundary";

const SUPPORT_EMAIL = "support@career-repo.com";

// Pricing pulls in the plan table and template catalogue: keep it out of the first-load bundle.
const PricingSection = lazyPage(() => import("./landing/PricingSection").then((m) => m.PricingSection));

interface Feature {
  icon: LucideIcon;
  title: string;
  free: string;
  premium: string;
}

// Every claim here must match a shipped feature and the enforced limits (PLAN_FEATURES).
const FEATURES: readonly Feature[] = [
  {
    icon: FileText,
    title: "CV builder",
    free: `Developer-focused CVs with a live preview, ${FREE_TIER.templateIds.length} templates and unlimited PDF downloads with no watermark.`,
    premium: "Unlimited CV versions, every template and AI writing help on our higher-quality model.",
  },
  {
    icon: Target,
    title: "CV match score",
    free: "Paste a job description to see your keyword match, the skills you're missing and ATS checks. Instant, no AI needed.",
    premium: "Tailor-for-this-job kit: one click creates a tailored CV and a matching cover letter.",
  },
  {
    icon: Mail,
    title: "Cover letters",
    free: `Keep up to ${FREE_TIER.coverLetters} letters, draft them with your monthly AI actions and export them as PDFs.`,
    premium: "Unlimited letters, with AI drafting and rewrites included (fair use).",
  },
  {
    icon: ClipboardList,
    title: "Job tracker",
    free: "Unlimited applications on a Kanban board, follow-up reminders in your Action Centre and funnel stats.",
    premium: "See which CV version gets you the most responses.",
  },
  {
    icon: MessagesSquare,
    title: "Interview practice",
    free: `${FREE_TIER.monthlyMockSessions} mock interviews a month with instant feedback, your session history and your top 3 weak topics.`,
    premium: "Unlimited sessions, every interviewer, a full topic breakdown and your weekly trend.",
  },
  {
    icon: Code,
    title: "Technical tests",
    free: `${FREE_TIER.monthlyTechTests} take-home briefs a month, each with a self-review rubric.`,
    premium: "Unlimited tests and an AI review of your submission.",
  },
];

const HIGHLIGHTS = [
  "Built for software developers",
  "Free plan, no card needed",
  "Unlimited job tracking & PDF downloads",
  "Cancel Premium any time",
];

const STATS = [
  { value: "6", label: "tools in one place" },
  { value: String(FREE_TIER.monthlyAiActions), label: "free AI actions a month" },
  { value: "£0", label: "to get started" },
];

export function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Account deletion ends with a full page load of "/?deleted=1".
  useEffect(() => {
    if (searchParams.get("deleted") !== "1") return;
    toast("success", "Your account and all its data have been deleted.");
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete("deleted");
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams, toast]);

  // A password-reset link that falls back to the site root still reaches the
  // reset form, once its code (requested in this browser) became a session.
  useEffect(() => {
    const link = authUrlAtLoad;
    if (link.pathname !== window.location.pathname || link.code !== "redeemable" || !link.recovery) return;
    let active = true;
    void (async () => {
      const { error } = await supabase.auth.initialize();
      if (!active || error) return;
      const { data } = await supabase.auth.getSession();
      if (!active || !data.session) return;
      markPasswordRecovery();
      const state: RecoveryNavigationState = { recovery: true };
      navigate("/reset-password", { replace: true, state });
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  // A confirmation link that falls back to the site root still continues a
  // "Create account & go Premium" sign-up made on this device.
  useEffect(() => {
    if (isAuthenticated && !hasPasswordRecovery() && takePremiumIntent()) {
      navigate(UPGRADE_PATH, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const freeHref = isAuthenticated ? "/app/dashboard" : "/register";

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="sticky top-0 z-30 h-14 glass glass-border flex items-center">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
              <Code2 className="h-3.5 w-3.5 text-white" />
            </span>
            <span className="text-sm font-bold tracking-tight text-text-primary">careerRepo</span>
          </Link>
          <nav aria-label="Main" className="flex items-center gap-2">
            <a href="#features" className="hidden md:inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary">
              Features
            </a>
            <a href="#pricing" className="hidden md:inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary">
              Pricing
            </a>
            {isAuthenticated ? (
              <Link
                to="/app/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                Go to dashboard <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register?plan=premium"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-accent-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-accent-800 transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                >
                  <Crown className="h-3 w-3" aria-hidden="true" />
                  Go Premium
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-3.5 py-1.5 text-xs font-semibold text-text-primary hover:bg-bg-tertiary transition-all duration-150 active:scale-95 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  Sign in <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section aria-labelledby="hero-heading" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" aria-hidden="true" />
          <div
            aria-hidden="true"
            className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-primary-600/8 dark:bg-primary-400/6 blur-[120px] pointer-events-none"
          />
          <div className="relative max-w-5xl mx-auto text-center px-5 sm:px-8 pt-20 sm:pt-28 md:pt-36 pb-16 sm:pb-24">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary-200 dark:border-primary-800/60 bg-primary-50 dark:bg-primary-900/20 px-3.5 py-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-8">
              <Target className="h-3 w-3" aria-hidden="true" />
              The career toolkit built for developers
            </p>
            <h1 id="hero-heading" className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.06] mb-6 text-text-primary">
              Land your next dev role,
              <br />
              <span className="gradient-text">faster &amp; smarter.</span>
            </h1>
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed mb-10">
              CVs, cover letters, job tracking and interview practice, built for software engineers. Start free with{" "}
              {FREE_TIER.monthlyAiActions} AI actions a month.{" "}
              <span className="text-accent-700 dark:text-accent-400 font-semibold">Premium</span> makes AI unlimited
              (fair use) and adds the Tailor-for-this-job kit.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
              {isAuthenticated ? (
                <Link to="/app/dashboard" className={`w-full sm:w-auto ${PRIMARY_CTA}`}>
                  Go to dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className={`w-full sm:w-auto ${PRIMARY_CTA}`}>
                    Get started free <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link to="/register?plan=premium" className={`w-full sm:w-auto ${PREMIUM_CTA}`}>
                    <Crown className="h-4 w-4" aria-hidden="true" />
                    Try Premium
                  </Link>
                </>
              )}
              <a href="#features" className={`w-full sm:w-auto ${SECONDARY_CTA}`}>
                Explore features
              </a>
            </div>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-500 shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-label="At a glance" className="border-y border-border bg-bg-secondary">
          <dl className="max-w-4xl mx-auto px-5 sm:px-8 py-5 grid grid-cols-3 divide-x divide-border text-center">
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col-reverse px-4">
                <dt className="text-xs sm:text-sm text-text-secondary mt-0.5">{label}</dt>
                <dd className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="features" aria-labelledby="features-heading" className="scroll-mt-16 max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <div className="text-center mb-14">
            <h2 id="features-heading" className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-4">
              Everything you need to land your next role
            </h2>
            <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto">
              Six tools with a generous free plan. Premium removes the limits and adds tools that save you hours on every
              application.
            </p>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, free, premium }) => (
              <li
                key={title}
                className="bg-bg-elevated border border-border rounded-2xl p-6 hover:border-primary-200 dark:hover:border-primary-800/60 hover:shadow-lg transition-all duration-200 flex flex-col"
              >
                <div
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600/10 dark:bg-primary-500/10 mb-4 ring-1 ring-primary-600/10 dark:ring-primary-400/10"
                >
                  <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-4 tracking-tight">{title}</h3>
                <p className="flex items-start gap-2 mb-3 text-[13px] text-text-secondary leading-relaxed">
                  <span className="shrink-0 mt-0.5 text-[9px] font-bold uppercase tracking-widest bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md px-2 py-0.5 ring-1 ring-border whitespace-nowrap">
                    Free
                  </span>
                  <span>{free}</span>
                </p>
                <p className="flex items-start gap-2 mt-auto pt-3 border-t border-border text-[13px] text-text-secondary leading-relaxed">
                  <span className="shrink-0 mt-0.5 text-[9px] font-bold uppercase tracking-widest bg-accent-50 dark:bg-accent-900/20 text-accent-800 dark:text-accent-300 rounded-md px-2 py-0.5 ring-1 ring-accent-200/60 dark:ring-accent-700/30 whitespace-nowrap flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                    Premium
                  </span>
                  <span>{premium}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>

        <SectionBoundary fallback={<PricingFallback />}>
          <Suspense fallback={<div className="min-h-[640px]" aria-hidden="true" />}>
            <PricingSection isAuthenticated={isAuthenticated} isPremium={isActivePremium(user)} />
          </Suspense>
        </SectionBoundary>

        <section aria-labelledby="cta-heading" className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
          <div className="relative overflow-hidden rounded-2xl bg-bg-elevated border border-border shadow-sm">
            <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary-500 to-primary-700 rounded-l-2xl" />
            <div className="flex flex-col sm:flex-row items-center gap-8 px-8 sm:px-12 py-10 sm:py-12">
              <div className="flex-1 text-center sm:text-left">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200/60 dark:border-primary-800/40 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-4">
                  <Zap className="h-3 w-3" aria-hidden="true" />
                  Free to start · No card needed
                </p>
                <h2 id="cta-heading" className="text-xl sm:text-3xl font-extrabold tracking-tight text-text-primary mb-3">
                  Ready to land your next role?
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto sm:mx-0">
                  Every tool has a free plan. Upgrade to{" "}
                  <span className="text-accent-700 dark:text-accent-400 font-semibold">Premium</span> any time for
                  unlimited use and AI that tailors each application.
                </p>
              </div>
              <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto">
                <Link to={freeHref} className={PRIMARY_CTA}>
                  {isAuthenticated ? "Go to dashboard" : "Get started free"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                {!isAuthenticated && (
                  <Link
                    to="/register?plan=premium"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent-300/60 dark:border-accent-700/40 bg-accent-50 dark:bg-accent-900/10 px-7 py-3 text-sm font-semibold text-accent-800 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-900/20 transition-all duration-150 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                  >
                    <Crown className="h-4 w-4" aria-hidden="true" />
                    Start with Premium — {PREMIUM_PRICE.perMonthLabel}
                  </Link>
                )}
                <p className="text-center text-[11px] text-text-secondary flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-primary-500" aria-hidden="true" />
                  Cancel Premium any time
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 px-5 text-xs text-text-tertiary">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>careerRepo &copy; {new Date().getFullYear()} · Built for developers, by developers.</p>
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link to="/privacy" className="hover:text-text-primary hover:underline">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-text-primary hover:underline">
              Terms of Service
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-text-primary hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
