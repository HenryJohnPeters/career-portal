import { useNavigate } from "react-router-dom";
import { useDashboardSummary } from "@careerportal/web/data-access";
import { useAuth } from "../../lib/auth";
import { Spinner, ErrorState } from "@careerportal/web/ui";
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
    iconBg: "bg-accent-dark",
    link: "/app/cv",
  },
  {
    label: "Cover Letters",
    key: "coverLetters" as const,
    subtitleFn: (n: number) => `${n === 1 ? "letter" : "letters"} drafted`,
    icon: Mail,
    iconBg: "bg-accent-dark",
    link: "/app/cover-letters",
  },
  {
    label: "Job Tracker",
    key: "jobs" as const,
    subtitleFn: (n: number) =>
      `${n === 1 ? "application" : "applications"} tracked`,
    icon: Briefcase,
    iconBg: "bg-accent-dark",
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
      <div className="text-center py-20 text-gray-400">No data available.</div>
    );

  const { counts, recentActivity } = summary;

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {/* Subtle accent glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-accent/8 dark:bg-accent/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-accent/5 dark:bg-accent/8 blur-3xl" />
        </div>

        {/* Top accent line */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-40" />

        <div className="relative px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-muted dark:bg-accent-muted/60">
                  <TrendingUp className="h-4.5 w-4.5 text-accent" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Overview
                </span>
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white ml-11">
                Welcome back 👋
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md leading-relaxed ml-11">
                Here's a snapshot of your career progress. Keep building, keep
                growing.
              </p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-accent-muted dark:bg-accent-muted/60">
              <Activity className="h-6 w-6 text-accent" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Premium Upgrade CTA (for free users) ── */}
      {!isPremium && (
        <button
          onClick={() => navigate("/app/billing")}
          className="w-full relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-500/5 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-amber-500/10 p-5 sm:p-6 text-left group hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/15 transition-colors" />
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Unlock Premium
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded px-1.5 py-0.5">
                    £9.99/mo
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  AI-powered CV rewriting, cover letter generation, and more
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400 group-hover:gap-2.5 transition-all">
              <Zap className="h-4 w-4" />
              Upgrade
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </button>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STAT_CARDS.map((c) => {
          const Icon = c.icon;
          const value = counts[c.key];
          return (
            <button
              key={c.label}
              onClick={() => navigate(c.link)}
              className="group relative text-left rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.iconBg} shadow-sm`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {value}
              </p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1">
                {c.label}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {c.subtitleFn(value)}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Recent Activity ── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-muted">
              <Clock className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
              <p className="text-xs text-gray-400">
                {recentActivity.length} recent items
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {recentActivity.length === 0 ? (
            <div className="text-center py-10">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-muted mb-3">
                <Activity className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm text-gray-400">No recent activity yet.</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                Start by creating a CV, writing a cover letter, or tracking a
                job.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((item: RecentActivityItem) => {
                const config = ACTIVITY_TYPE_CONFIG[item.type] || {
                  label: item.type,
                  icon: Activity,
                  color: "text-gray-500 bg-gray-50 dark:bg-gray-800",
                };
                const TypeIcon = config.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.color}`}
                    >
                      <TypeIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-400">{config.label}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                      {new Date(item.updatedAt).toLocaleDateString()}
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
