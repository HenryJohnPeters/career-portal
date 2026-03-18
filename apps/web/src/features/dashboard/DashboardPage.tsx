import { useNavigate } from "react-router-dom";
import { useDashboardSummary } from "@careerportal/web/data-access";
import { useAuth } from "../../lib/auth";
import { Spinner, ErrorState, Card, Badge } from "@careerportal/web/ui";
import { PageHero } from "../shared";
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
  GitCommit,
} from "lucide-react";
import type { RecentActivityItem } from "@careerportal/shared/types";

const STAT_CARDS = [
  {
    label: "CV Builder",
    key: "cvVersions" as const,
    subtitleFn: (n: number) => `${n === 1 ? "version" : "versions"} created`,
    icon: FileText,
    link: "/app/cv",
  },
  {
    label: "Cover Letters",
    key: "coverLetters" as const,
    subtitleFn: (n: number) => `${n === 1 ? "letter" : "letters"} drafted`,
    icon: Mail,
    link: "/app/cover-letters",
  },
  {
    label: "Job Tracker",
    key: "jobs" as const,
    subtitleFn: (n: number) =>
      `${n === 1 ? "application" : "applications"} tracked`,
    icon: Briefcase,
    link: "/app/jobs",
  },
];

const ACTIVITY_TYPE_CONFIG: Record<
  string,
  {
    label: string;
    icon: typeof FileText;
    iconBg: string;
    iconColor: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  cv: {
    label: "CV",
    icon: FileText,
    iconBg: "bg-primary-50 dark:bg-primary-900/30",
    iconColor: "text-primary-600 dark:text-primary-400",
    badgeClass:
      "bg-primary-50 text-primary-700 ring-primary-200/60 dark:bg-primary-900/30 dark:text-primary-300 dark:ring-primary-700/40",
    dotClass: "bg-primary-500",
  },
  "cover-letter": {
    label: "Cover Letter",
    icon: Mail,
    iconBg: "bg-cyan-50 dark:bg-cyan-900/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    badgeClass:
      "bg-cyan-50 text-cyan-700 ring-cyan-200/60 dark:bg-cyan-900/30 dark:text-cyan-300 dark:ring-cyan-700/40",
    dotClass: "bg-cyan-400",
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

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
      <div className="text-center py-20 text-text-tertiary text-sm">
        No data available.
      </div>
    );

  const { counts, recentActivity } = summary;

  return (
    <div className="space-y-5 animate-fade-in-up max-w-5xl">
      <PageHero
        icon={TrendingUp}
        title={`Welcome back${
          user?.name ? `, ${user.name.split(" ")[0]}` : ""
        }`}
        subtitle="Here's a snapshot of your career progress."
        stats={[
          {
            value: counts.cvVersions,
            label: `CV Version${counts.cvVersions !== 1 ? "s" : ""}`,
          },
          {
            value: counts.coverLetters,
            label: `Cover Letter${counts.coverLetters !== 1 ? "s" : ""}`,
          },
          {
            value: counts.jobs,
            label: `Application${counts.jobs !== 1 ? "s" : ""}`,
          },
        ]}
      />

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
                <p className="text-sm font-semibold text-text-primary">
                  Unlock Premium AI Features
                </p>
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
              <p className="text-3xl font-extrabold tracking-tight text-text-primary mb-0.5">
                {value}
              </p>
              <p className="text-xs font-semibold text-text-primary mb-0.5">
                {c.label}
              </p>
              <p className="text-[11px] text-text-tertiary">
                {c.subtitleFn(value)}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Recent Activity ── */}
      <div className="rounded-2xl border border-border bg-bg-elevated shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600/10 dark:bg-primary-400/10 ring-1 ring-primary-600/10 dark:ring-primary-400/15">
              <Clock className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary leading-none mb-0.5">
                Recent Activity
              </h2>
              <p className="text-[11px] text-text-tertiary">
                {recentActivity.length > 0
                  ? `${recentActivity.length} recent update${
                      recentActivity.length !== 1 ? "s" : ""
                    }`
                  : "No activity yet"}
              </p>
            </div>
          </div>
          {recentActivity.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-[10px] font-semibold text-primary-600 dark:text-primary-400 ring-1 ring-primary-200/50 dark:ring-primary-700/30">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
              Live
            </span>
          )}
        </div>

        {recentActivity.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="relative mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 ring-1 ring-border">
                <Activity className="h-6 w-6 text-text-tertiary" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-bg-elevated ring-2 ring-bg-elevated">
                <GitCommit className="h-3 w-3 text-text-tertiary" />
              </span>
            </div>
            <p className="text-sm font-semibold text-text-secondary mb-1">
              No activity yet
            </p>
            <p className="text-xs text-text-tertiary max-w-xs leading-relaxed">
              Create a CV, write a cover letter, or track a job application to
              see your activity here.
            </p>
          </div>
        ) : (
          /* Activity list */
          <div className="divide-y divide-border/60">
            {recentActivity.map((item: RecentActivityItem, idx: number) => {
              const config = ACTIVITY_TYPE_CONFIG[item.type] ?? {
                label: item.type,
                icon: Activity,
                iconBg: "bg-neutral-100 dark:bg-neutral-800",
                iconColor: "text-neutral-500 dark:text-neutral-400",
                badgeClass:
                  "bg-neutral-100 text-neutral-600 ring-neutral-200/60 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700/40",
                dotClass: "bg-neutral-400",
              };
              const TypeIcon = config.icon;
              const isLast = idx === recentActivity.length - 1;
              return (
                <div
                  key={item.id}
                  className="group flex items-center gap-4 px-5 py-3.5 hover:bg-bg-tertiary/60 transition-colors duration-150"
                >
                  {/* Icon */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.iconBg} ring-1 ring-border`}
                  >
                    <TypeIcon className={`h-4 w-4 ${config.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate leading-snug">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ring-1 ${config.badgeClass}`}
                      >
                        {config.label}
                      </span>
                      <span className="text-[11px] text-text-tertiary">
                        updated
                      </span>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-medium text-text-tertiary tabular-nums">
                      {timeAgo(item.updatedAt)}
                    </span>
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${config.dotClass} ml-auto mt-1.5 opacity-60`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
