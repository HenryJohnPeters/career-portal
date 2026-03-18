import { useNavigate } from "react-router-dom";
import { useDashboardSummary } from "@careerportal/web/data-access";
import { useAuth } from "../../lib/auth";
import { Spinner, ErrorState, Card, Badge } from "@careerportal/web/ui";
import {
  FileText, Mail, Briefcase, TrendingUp, Clock,
  Activity, ArrowRight, Crown, Sparkles, Zap,
} from "lucide-react";
import type { RecentActivityItem } from "@careerportal/shared/types";

const STAT_CARDS = [
  { label: "CV Builder", key: "cvVersions" as const, subtitleFn: (n: number) => `${n === 1 ? "version" : "versions"} created`, icon: FileText, link: "/app/cv" },
  { label: "Cover Letters", key: "coverLetters" as const, subtitleFn: (n: number) => `${n === 1 ? "letter" : "letters"} drafted`, icon: Mail, link: "/app/cover-letters" },
  { label: "Job Tracker", key: "jobs" as const, subtitleFn: (n: number) => `${n === 1 ? "application" : "applications"} tracked`, icon: Briefcase, link: "/app/jobs" },
];

const ACTIVITY_TYPE_CONFIG: Record<string, { label: string; icon: typeof FileText; colorClass: string }> = {
  cv: { label: "CV", icon: FileText, colorClass: "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400" },
  "cover-letter": { label: "Cover Letter", icon: Mail, colorClass: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" },
};

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboardSummary();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPremium = user?.isPremium ?? false;

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

  const summary = data?.data;
  if (!summary) return <div className="text-center py-20 text-text-tertiary text-sm">No data available.</div>;

  const { counts, recentActivity } = summary;

  return (
    <div className="space-y-5 animate-fade-in-up max-w-5xl">
      {/* Welcome banner */}
      <div className="rounded-2xl border border-border bg-bg-elevated shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 shadow-sm">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-0.5">Overview</p>
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-xs text-text-tertiary mt-0.5 hidden sm:block">
              Here's a snapshot of your career progress.
            </p>
          </div>
          <div className="hidden lg:flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/8 dark:bg-primary-400/10">
            <Activity className="h-5 w-5 text-primary-500 dark:text-primary-400" />
          </div>
        </div>
      </div>

      {/* Premium upgrade CTA */}
      {!isPremium && (
        <button
          onClick={() => navigate("/app/billing")}
          className="w-full rounded-2xl border border-amber-200/70 dark:border-amber-700/30 bg-amber-50/60 dark:bg-amber-900/10 p-5 text-left group hover:border-amber-300 dark:hover:border-amber-600/40 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:shadow-sm transition-all duration-200 active:scale-[0.995]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-amber-400 shadow-sm shrink-0">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-text-primary">Unlock Premium AI Features</p>
                <Badge variant="warning">£9.99/mo</Badge>
              </div>
              <p className="text-xs text-text-secondary flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                AI-powered CV rewriting, cover letters, interview prep & more
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:gap-2.5 transition-all shrink-0">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Upgrade</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </button>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STAT_CARDS.map((c) => {
          const Icon = c.icon;
          const value = counts[c.key];
          return (
            <button
              key={c.label}
              onClick={() => navigate(c.link)}
              className="group text-left rounded-2xl border border-border bg-bg-elevated shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800/60 hover:-translate-y-px transition-all duration-200 p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600/10 dark:bg-primary-500/10 ring-1 ring-primary-600/10">
                  <Icon className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
                </div>
                <ArrowRight className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-3xl font-extrabold tracking-tight text-text-primary mb-0.5">{value}</p>
              <p className="text-xs font-semibold text-text-primary mb-0.5">{c.label}</p>
              <p className="text-[11px] text-text-tertiary">{c.subtitleFn(value)}</p>
            </button>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl border border-border bg-bg-elevated shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/8 dark:bg-primary-400/10">
            <Clock className="h-4 w-4 text-primary-500 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Recent Activity</h2>
            <p className="text-[11px] text-text-tertiary">{recentActivity.length} recent {recentActivity.length === 1 ? "item" : "items"}</p>
          </div>
        </div>

        <div className="p-4">
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 ring-1 ring-border mb-3">
                <Activity className="h-5 w-5 text-text-tertiary" />
              </div>
              <p className="text-sm font-medium text-text-secondary mb-1">No activity yet</p>
              <p className="text-xs text-text-tertiary max-w-xs">Create a CV, write a cover letter, or track a job application to get started.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((item: RecentActivityItem) => {
                const config = ACTIVITY_TYPE_CONFIG[item.type] ?? {
                  label: item.type, icon: Activity,
                  colorClass: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
                };
                const TypeIcon = config.icon;
                return (
                  <div key={item.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-bg-tertiary transition-colors">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.colorClass}`}>
                      <TypeIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                      <p className="text-[11px] text-text-tertiary">{config.label}</p>
                    </div>
                    <span className="text-[11px] text-text-tertiary whitespace-nowrap shrink-0 tabular-nums">
                      {new Date(item.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
