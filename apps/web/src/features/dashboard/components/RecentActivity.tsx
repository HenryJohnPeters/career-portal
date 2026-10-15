import { useId } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Briefcase,
  ClipboardCheck,
  Clock,
  FileText,
  Mail,
  Mic,
  type LucideIcon,
} from "lucide-react";
import type { RecentActivityItem } from "@careerportal/shared/types";
import { Card } from "@careerportal/web/ui";
import { activityHref, timeAgo } from "../lib/summary";

const TYPE_CONFIG: Record<RecentActivityItem["type"], { label: string; icon: LucideIcon; tint: string }> = {
  cv: { label: "CV", icon: FileText, tint: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" },
  "cover-letter": { label: "Cover letter", icon: Mail, tint: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
  job: { label: "Application", icon: Briefcase, tint: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
  interview: { label: "Mock interview", icon: Mic, tint: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  "technical-test": {
    label: "Technical test",
    icon: ClipboardCheck,
    tint: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
};

const FALLBACK = {
  label: "Update",
  icon: Activity,
  tint: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};

export function RecentActivity({ items }: { items: readonly RecentActivityItem[] }) {
  const headingId = useId();
  const now = Date.now();

  return (
    <Card className="overflow-hidden">
      <section aria-labelledby={headingId}>
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Clock className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          <h2 id={headingId} className="text-sm font-semibold text-text-primary">
            Recent activity
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <Activity className="mb-3 h-6 w-6 text-text-tertiary" aria-hidden="true" />
            <p className="text-sm font-semibold text-text-secondary">No activity yet</p>
            <p className="mt-1 max-w-xs text-xs text-text-tertiary">
              Your CVs, cover letters, applications, mock interviews and tests will appear here as you work on them.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((item) => {
              const config = TYPE_CONFIG[item.type] ?? FALLBACK;
              const Icon = config.icon;
              const href = activityHref(item);
              const content = (
                <>
                  <span
                    aria-hidden="true"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-border ${config.tint}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text-primary">{item.title}</span>
                    <span className="text-[11px] text-text-tertiary">{config.label}</span>
                  </span>
                  <time dateTime={item.updatedAt} className="shrink-0 text-xs font-medium tabular-nums text-text-tertiary">
                    {timeAgo(item.updatedAt, now)}
                  </time>
                </>
              );
              return (
                <li key={`${item.type}-${item.id}`}>
                  {href ? (
                    <Link
                      to={href}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-bg-tertiary/60 transition-colors focus:outline-none focus-visible:bg-bg-tertiary/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-4 px-5 py-3">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Card>
  );
}
