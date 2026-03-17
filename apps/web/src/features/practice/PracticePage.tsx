import { NavLink } from "react-router-dom";
import { useMe } from "@careerportal/web/data-access";
import { Brain, CheckCircle2, Crown, Sparkles } from "lucide-react";
import { Spinner, ErrorState } from "@careerportal/web/ui";
import { usePracticeState } from "./hooks/usePracticeState";
import { PracticeSetup } from "./components/PracticeSetup";
import { PracticeQuiz } from "./components/PracticeQuiz";

export function PracticePage() {
  const { data: meData, isLoading: meLoading } = useMe();
  const isPremium = meData?.data?.isPremium ?? false;
  const state = usePracticeState();

  if (state.isLoadingOptions) return <Spinner />;
  if (state.isError)
    return (
      <ErrorState
        message={(state.error as Error).message}
        onRetry={state.refetch}
      />
    );

  // Premium gate for free users
  if (!meLoading && !isPremium) {
    return <PracticePremiumGate />;
  }

  if (state.view === "setup") {
    return <PracticeSetup state={state} onStart={state.handleStart} />;
  }

  return <PracticeQuiz state={state} />;
}

function PracticePremiumGate() {
  return (
    <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left — Hero */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-800/30 mb-5">
            <Brain className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">
            Practice Questions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 max-w-sm">
            AI-powered questions tailored to your role, level, and tech stack —
            with instant feedback and progress tracking.
          </p>
          <NavLink
            to="/app/billing"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white hover:bg-accent-dark transition-colors shadow-sm"
          >
            <Crown className="h-4 w-4" />
            Upgrade to Premium
          </NavLink>
          <p className="mt-3 text-xs text-gray-400 dark:text-gray-600">
            <Sparkles className="h-3 w-3 inline mr-1" />
            Includes unlimited AI features, interview prep &amp; technical tests
          </p>
        </div>

        {/* Right — Features grid */}
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-950/20 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-4">
            What's included
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              "Tailored to your role & level",
              "Covers frontend, backend, fullstack & more",
              "Instant answer feedback & explanations",
              "Multiple choice & multi-select formats",
              "Filter by tech stack & topics",
              "Unlimited daily questions",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-2 rounded-xl bg-white/70 dark:bg-white/5 border border-amber-100 dark:border-amber-800/30 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300"
              >
                <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
