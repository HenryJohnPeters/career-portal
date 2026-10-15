import { TrendingUp } from "lucide-react";
import { getErrorMessage, useDashboardSummary } from "@careerportal/web/data-access";
import { ErrorState, Spinner } from "@careerportal/web/ui";
import { PlanUsageCard } from "../../components/PlanUsageCard";
import { useAuth } from "../../lib/auth";
import { PageHero } from "../shared";
import { ActionCentre } from "./components/ActionCentre";
import { OnboardingChecklist } from "./components/OnboardingChecklist";
import { PipelineCard } from "./components/PipelineCard";
import { RecentActivity } from "./components/RecentActivity";
import { normalizeSummary } from "./lib/summary";

export function DashboardPage() {
  const { data, isPending, error, refetch } = useDashboardSummary();
  const { user } = useAuth();

  if (isPending) return <Spinner label="Loading your dashboard" />;
  if (!data) {
    return (
      <ErrorState
        message={getErrorMessage(error, "Your dashboard couldn't be loaded.")}
        onRetry={() => void refetch()}
      />
    );
  }

  const summary = normalizeSummary(data.data);
  const { counts, onboarding } = summary;
  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <div className="space-y-5 animate-fade-in-up motion-reduce:animate-none">
      <PageHero
        icon={TrendingUp}
        title={`Welcome back${firstName ? `, ${firstName}` : ""}`}
        subtitle="Here's what needs your attention and how your search is going."
        stats={[
          { value: counts.jobs, label: counts.jobs === 1 ? "Application" : "Applications" },
          { value: counts.interviewSessions, label: counts.interviewSessions === 1 ? "Mock interview" : "Mock interviews" },
          { value: counts.cvVersions, label: counts.cvVersions === 1 ? "CV version" : "CV versions" },
        ]}
      />

      {!onboarding.dismissed && <OnboardingChecklist steps={onboarding.steps} />}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <ActionCentre actionCentre={summary.actionCentre} />
          <RecentActivity items={summary.recentActivity} />
        </div>
        <div className="space-y-5">
          <PlanUsageCard compact />
          <PipelineCard pipeline={summary.pipeline} />
        </div>
      </div>
    </div>
  );
}
