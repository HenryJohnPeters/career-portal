import { useNavigate } from "react-router-dom";
import { useDashboardSummary } from "@careerportal/web/data-access";
import { useAuth } from "../../lib/auth";
import { Spinner, ErrorState, Card, Badge } from "@careerportal/web/ui";
import {
  FileText,
  Mail,
  Briefcase,
  TrendingUp,
  Clock,
  Activity,
  ArrowRight,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";
import type { RecentActivityItem } from "@careerportal/shared/types";

const STAT_CARDS = [
  {
    label: "CV Builder",
    key: "cvVersions" as const,
    subtitleFn: (n: number) => `${n === 1 ? "version" : "versions"} created`,
    icon: FileText,
    iconBg: "bg-primary-600",
    link: "/app/cv",
  },
  {
    label: "Cover Letters",
    key: "coverLetters" as const,
    subtitleFn: (n: number) => `${n === 1 ? "letter" : "letters"} drafted`,
    icon: Mail,
    iconBg: "bg-primary-600",
    link: "/app/cover-letters",
  },
  {
    label: "Job Tracker",
    key: "jobs" as const,
    subtitleFn: (n: number) =>
      `${n === 1 ? "application" : "applications"} tracked`,
    icon: Briefcase,
    iconBg: "bg-primary-600",
    link: "/app/jobs",
  },
];

const ACTIVITY_TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof FileText; color: string }
> = {
  cv: {
    label: "CV",
    icon: FileText,
    color: "text-accent bg-accent-muted",
  },
  "cover-letter": {
    label: "Cover Letter",
    icon: Mail,
    color: "text-accent bg-accent-muted",
  },
};

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboardSummary();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPremium = user?.isPremium ?? false;

  if (isLoading) return <Spinner />;
  if (isError)
    return <ErrorState message={(error as Error).message} onRetry={refetch} />;

  const summary = data?.data;
  if (!summary)
    return (
      <div className="text-center py-20 text-text-tertiary">
        No data available.
      </div>
    );

  const { counts, recentActivity } = summary;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Welcome Banner ── */}
      <Card gradient className="relative overflow-hidden border-0 shadow-md">
        <div className="relative px-6 py-8 sm:px-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 shadow-sm">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <Badge variant="primary" className="mb-1">
                    Overview
                  </Badge>
                  <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                    Welcome back! 👋
                  </h1>
                </div>
              </div>
              <p className="text-sm text-text-secondary max-w-2xl leading-relaxed ml-14">
                Here's a snapshot of your career progress. Keep building, keep
                growing, and stay focused on your goals.
              </p>
            </div>
            <div className="hidden lg:flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 dark:bg-primary-400/10">
              <Activity className="h-7 w-7 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Premium Upgrade CTA (for free users) ── */}
      {!isPremium && (
        <button
          onClick={() => navigate("/app/billing")}
          className="w-full rounded-2xl border border-accent-400/30 bg-accent-50 dark:bg-accent-900/10 p-6 text-left group hover:border-accent-400/50 hover:bg-accent-50 dark:hover:bg-accent-900/20 hover:shadow-md transition-all duration-200 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-400 text-white shadow-sm">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-text-primary">
                    Unlock Premium Features
                  </h3>
                  <Badge variant="warning">£9.99/mo</Badge>
                </div>
                <p className="text-sm text-text-secondary flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent-500" />
                  AI-powered CV rewriting, cover letter generation, interview
                  prep & more
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-accent-600 dark:text-accent-400 group-hover:gap-3 transition-all">
              <Zap className="h-5 w-5" />
              Upgrade Now
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        </button>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {STAT_CARDS.map((c) => {
          const Icon = c.icon;
          const value = counts[c.key];
          return (
            <Card
              key={c.label}
              hover
              className="group cursor-pointer p-6 border-0 shadow-md"
              onClick={() => navigate(c.link)}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 shadow-sm">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <ArrowRight className="h-5 w-5 text-text-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-4xl font-bold text-text-primary tracking-tight mb-1">
                {value}
              </p>
              <p className="text-sm font-semibold text-text-primary mb-0.5">
                {c.label}
              </p>
              <p className="text-xs text-text-tertiary">
                {c.subtitleFn(value)}
              </p>
            </Card>
          );
        })}
      </div>

      {/* ── Recent Activity ── */}
      <Card className="overflow-hidden border-0 shadow-md">
        <div className="flex items-center justify-between p-6 pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 dark:bg-primary-400/10">
              <Clock className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Recent Activity
              </h2>
              <p className="text-xs text-text-tertiary">
                {recentActivity.length} recent{" "}
                {recentActivity.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 dark:bg-primary-400/10 mb-4">
                <Activity className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-sm font-medium text-text-secondary mb-1">
                No recent activity yet
              </p>
              <p className="text-xs text-text-tertiary">
                Start by creating a CV, writing a cover letter, or tracking a
                job application.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((item: RecentActivityItem) => {
                const config = ACTIVITY_TYPE_CONFIG[item.type] || {
                  label: item.type,
                  icon: Activity,
                  color: "text-neutral-500 bg-neutral-100 dark:bg-neutral-800",
                };
                const TypeIcon = config.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-bg-tertiary transition-colors group"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.color}`}
                    >
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {config.label}
                      </p>
                    </div>
                    <span className="text-xs text-text-tertiary whitespace-nowrap shrink-0 font-medium">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
