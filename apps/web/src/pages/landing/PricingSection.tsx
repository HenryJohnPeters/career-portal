import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronDown, Crown } from "lucide-react";
import { PREMIUM_PRICE } from "@careerportal/shared/types";
import { PlanComparison } from "../shared/PlanComparison";
import { planHighlights } from "../shared/plan-highlights";
import { PREMIUM_CTA, PRIMARY_CTA } from "./cta-styles";

const FREE_HIGHLIGHTS = planHighlights("free", [
  "jobTracker",
  "pdfExport",
  "cvMatch",
  "cvVersions",
  "coverLetters",
  "aiActions",
  "mockInterviews",
]);

const PREMIUM_HIGHLIGHTS = planHighlights("premium", [
  "cvVersions",
  "templates",
  "aiActions",
  "aiModel",
  "tailorKit",
  "insights",
  "interviewProgress",
  "aiTechReview",
]);

/** Landing #pricing: plan cards and the full comparison, all generated from PLAN_FEATURES. */
export function PricingSection({ isAuthenticated, isPremium }: { isAuthenticated: boolean; isPremium: boolean }) {
  const freeHref = isAuthenticated ? "/app/dashboard" : "/register";
  const premiumHref = isAuthenticated ? "/app/billing" : "/register?plan=premium";

  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="scroll-mt-16 max-w-5xl mx-auto px-5 sm:px-8 pb-20 sm:pb-28">
      <div className="text-center mb-10">
        <h2 id="pricing-heading" className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-4">
          Simple pricing
        </h2>
        <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto">
          Start free and stay free as long as you like. Upgrade when you want more, and cancel any time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlanCard
          title="Free"
          price="£0"
          blurb="Everything you need to run a focused job search."
          highlights={FREE_HIGHLIGHTS}
          cta={
            <Link to={freeHref} className={`w-full ${PRIMARY_CTA}`}>
              {isAuthenticated ? "Go to dashboard" : "Get started free"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />
        <PlanCard
          premium
          title="Premium"
          price={PREMIUM_PRICE.label}
          blurb="No limits, our best AI and tools that tailor every application."
          highlights={PREMIUM_HIGHLIGHTS}
          cta={
            <Link to={premiumHref} className={`w-full ${PREMIUM_CTA}`}>
              <Crown className="h-4 w-4" aria-hidden="true" />
              {!isAuthenticated
                ? `Start with Premium — ${PREMIUM_PRICE.perMonthLabel}`
                : isPremium
                  ? "Manage your plan"
                  : "Upgrade to Premium"}
            </Link>
          }
        />
      </div>

      <details className="group mt-6">
        <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-primary-700 dark:text-primary-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 [&::-webkit-details-marker]:hidden">
          Compare every feature
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <PlanComparison className="mt-4" />
      </details>
    </section>
  );
}

function PlanCard({
  title,
  price,
  blurb,
  highlights,
  cta,
  premium = false,
}: {
  title: string;
  price: string;
  blurb: string;
  highlights: readonly string[];
  cta: ReactNode;
  premium?: boolean;
}) {
  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-bg-elevated p-6 shadow-sm ${
        premium ? "border-accent-300/70 dark:border-accent-700/50 ring-1 ring-accent-400/20" : "border-border"
      }`}
    >
      <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary">
        {premium && <Crown className="h-4 w-4 text-accent-700 dark:text-accent-400" aria-hidden="true" />}
        {title}
      </h3>
      <p className="mt-1 text-xs text-text-secondary">{blurb}</p>
      <p className="mt-5 mb-6">
        <span className="text-3xl font-extrabold tracking-tight text-text-primary">{price}</span>
        <span className="ml-1 text-xs text-text-secondary">/ month</span>
      </p>
      <ul className="mb-6 space-y-2.5">
        {highlights.map((line) => (
          <li key={line} className="flex items-start gap-2 text-xs text-text-secondary">
            <Check
              className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${premium ? "text-accent-700 dark:text-accent-400" : "text-emerald-600 dark:text-emerald-400"}`}
              aria-hidden="true"
            />
            {line}
          </li>
        ))}
      </ul>
      <div className="mt-auto">{cta}</div>
    </article>
  );
}
