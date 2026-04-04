import { NavLink } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { Lock, Crown, Code2, CheckCircle2, Sparkles } from "lucide-react";
import { useTechTestState } from "./hooks/useTechTestState";
import { TechTestSetup } from "./components/TechTestSetup";
import { TechTestBrief } from "./components/TechTestBrief";
import { TechTestSession } from "./components/TechTestSession";
import { TechTestResults } from "./components/TechTestResults";
import { TechTestHistory } from "./components/TechTestHistory";

export function TechnicalTestsPage() {
  const { user, isLoading: meLoading } = useAuth();
  const isPremium = user?.isPremium ?? false;
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
      <div className="rounded-2xl border border-accent-400/30 bg-accent-50 dark:bg-accent-900/20 p-8 shadow-sm">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-400/20 mb-5">
          <Code2 className="h-8 w-8 text-accent-600 dark:text-accent-400" />
        </div>

        <h2 className="text-2xl font-bold text-accent-700 dark:text-accent-300 mb-2">
          Technical Tests
        </h2>
        <p className="text-sm text-accent-800 dark:text-accent-200 mb-6 max-w-md mx-auto leading-relaxed">
          Take-home style coding challenges with AI-generated scenarios tailored
          to your tech stack and level.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 text-left max-w-md mx-auto">
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
              className="flex items-start gap-2 text-xs text-accent-800 dark:text-accent-200"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-accent-500 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <NavLink
          to="/app/billing"
          className="inline-flex items-center gap-2 rounded-xl bg-accent-400 hover:bg-accent-500 px-6 py-3 text-sm font-bold text-white transition-colors shadow-sm"
        >
          <Crown className="h-4 w-4" />
          Upgrade to Premium — £9.99/mo
        </NavLink>

        <p className="mt-3 text-xs text-accent-700 dark:text-accent-300">
          <Sparkles className="h-3 w-3 inline mr-1" />
          Premium includes unlimited AI features, interview prep & technical
          tests
        </p>
      </div>
    </div>
  );
}
