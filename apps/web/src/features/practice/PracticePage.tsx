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
    <div className="w-full max-w-2xl mx-auto py-16 text-center">
      <div className="rounded-3xl border-2 border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 p-12 shadow-sm">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 dark:bg-amber-800/30 mb-6">
          <Brain className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          Practice Questions
        </h2>
        <p className="text-base text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
          AI-powered practice questions tailored to your role, level, and tech
          stack — with instant feedback and progress tracking.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left max-w-md mx-auto">
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
              className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
            >
              <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <NavLink
          to="/app/billing"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3.5 text-sm font-bold text-white hover:bg-accent-dark transition-colors shadow-sm"
        >
          <Crown className="h-4 w-4" />
          Upgrade to Premium
        </NavLink>

        <p className="mt-4 text-xs text-gray-400 dark:text-gray-600">
          <Sparkles className="h-3 w-3 inline mr-1" />
          Premium includes unlimited AI features, interview prep & technical
          tests
        </p>
      </div>
    </div>
  );
}
