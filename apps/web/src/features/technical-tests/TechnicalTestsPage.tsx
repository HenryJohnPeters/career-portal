import { NavLink } from "react-router-dom";
import { useMe } from "@careerportal/web/data-access";
import { Lock, Crown, Code2, CheckCircle2, Sparkles } from "lucide-react";
import { useTechTestState } from "./hooks/useTechTestState";
import { TechTestSetup } from "./components/TechTestSetup";
import { TechTestBrief } from "./components/TechTestBrief";
import { TechTestSession } from "./components/TechTestSession";
import { TechTestResults } from "./components/TechTestResults";
import { TechTestHistory } from "./components/TechTestHistory";

export function TechnicalTestsPage() {
  const { data: meData, isLoading: meLoading } = useMe();
  const isPremium = meData?.data?.isPremium ?? false;
  const state = useTechTestState();

  // Premium gate for free users
  if (!meLoading && !isPremium) {
    return <TechTestPremiumGate />;
  }

  if (state.view === "setup") return <TechTestSetup state={state} />;
  if (state.view === "brief") return <TechTestBrief state={state} />;
  if (state.view === "working") return <TechTestSession state={state} />;
  if (state.view === "results") return <TechTestResults state={state} />;
  if (state.view === "history") return <TechTestHistory state={state} />;

  return null;
}

function TechTestPremiumGate() {
  return (
    <div className="w-full max-w-2xl mx-auto py-16 text-center">
      <div className="rounded-3xl border-2 border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 p-12 shadow-sm">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 dark:bg-amber-800/30 mb-6">
          <Code2 className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          Technical Tests
        </h2>
        <p className="text-base text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
          Take-home style coding challenges with AI-generated scenarios tailored
          to your tech stack, level, and role focus.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left max-w-md mx-auto">
          {[
            "AI-generated realistic scenarios",
            "Tailored to your tech stack",
            "Timed sessions with auto-submit",
            "Detailed evaluation & scoring",
            "Covers frontend, backend, fullstack & platform",
            "Unlimited test generation",
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
