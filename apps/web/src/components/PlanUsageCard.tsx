import { useId, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Crown, Gauge, Sparkles } from "lucide-react";
import type { QuotaKey } from "@careerportal/shared/types";
import { usePlanUsage } from "@careerportal/web/data-access";
import { Badge, Button, Card } from "@careerportal/web/ui";
import {
  METER_ORDER,
  buildMeterRows,
  formatResetDate,
  visibleFairUseRows,
  type MeterTone,
} from "../lib/plan-usage";

const TONE_BAR: Record<MeterTone, string> = {
  ok: "bg-primary-500",
  warning: "bg-amber-500",
  exhausted: "bg-red-500",
};

const TONE_TEXT: Record<MeterTone, string> = {
  ok: "text-text-secondary",
  warning: "text-amber-700 dark:text-amber-400",
  exhausted: "text-red-600 dark:text-red-400",
};

/** Monthly allowances only (the compact card and the sidebar). */
const COMPACT_KEYS: readonly QuotaKey[] = ["aiActions", "mockSessions", "questions", "techTests"];

interface UsageMeterBarProps {
  label: string;
  used: number;
  /** null = unlimited (no bar) */
  limit: number | null;
  percent: number | null;
  tone: MeterTone;
  /** Shown as "Resets 1 Nov" when given. */
  resetsAt?: string | null;
  size?: "sm" | "md";
}

/** One labelled usage meter with an accessible progress bar. */
export function UsageMeterBar({ label, used, limit, percent, tone, resetsAt, size = "md" }: UsageMeterBarProps) {
  const labelId = useId();
  const resetLabel = formatResetDate(resetsAt);
  const small = size === "sm";

  return (
    <div>
      <div className={`flex items-baseline justify-between gap-2 ${small ? "text-[11px]" : "text-xs"}`}>
        <span id={labelId} className="font-medium text-text-secondary truncate">
          {label}
        </span>
        <span className={`shrink-0 tabular-nums font-semibold ${TONE_TEXT[tone]}`}>
          {limit === null ? `${used} · Unlimited` : `${used} / ${limit}`}
        </span>
      </div>
      {limit !== null && percent !== null && (
        <div
          role="progressbar"
          aria-labelledby={labelId}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={Math.min(used, limit)}
          aria-valuetext={`${used} of ${limit} used`}
          className={`mt-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800 ${small ? "h-1" : "h-1.5"}`}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${TONE_BAR[tone]}`}
            style={{ width: `${Math.max(percent, used > 0 ? 3 : 0)}%` }}
          />
        </div>
      )}
      {resetLabel && !small && (
        <p className="mt-1 text-[11px] text-text-tertiary">Resets {resetLabel}</p>
      )}
    </div>
  );
}

function UsageSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-4 animate-pulse motion-reduce:animate-none" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        </div>
      ))}
    </div>
  );
}

interface PlanUsageCardProps {
  /** Monthly allowances only, single column (e.g. on the dashboard). */
  compact?: boolean;
}

/** Plan & usage overview: free allowances with reset dates, or Premium fair-use status. */
export function PlanUsageCard({ compact = false }: PlanUsageCardProps) {
  const headingId = useId();
  const { data, isPending, isError, refetch, isRefetching } = usePlanUsage();
  const usage = data?.data;
  const keys = compact ? COMPACT_KEYS : METER_ORDER;

  const header = (badge?: ReactNode) => (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 id={headingId} className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Gauge className="h-4 w-4 text-primary-500" aria-hidden="true" />
        Plan &amp; usage
      </h2>
      {badge}
    </div>
  );

  if (isPending) {
    return (
      <Card className={compact ? "p-4" : "p-5"}>
        <section aria-labelledby={headingId} aria-busy="true">
          {header()}
          <UsageSkeleton rows={compact ? 3 : 4} />
        </section>
      </Card>
    );
  }

  if (isError || !usage) {
    return (
      <Card className={compact ? "p-4" : "p-5"}>
        <section aria-labelledby={headingId}>
          {header()}
          <p role="alert" className="text-sm text-text-secondary">
            We couldn't load your usage right now.
          </p>
          <Button variant="outline" size="sm" className="mt-3" loading={isRefetching} onClick={() => void refetch()}>
            Try again
          </Button>
        </section>
      </Card>
    );
  }

  if (usage.isPremium) {
    const fairUse = visibleFairUseRows(usage.fairUse);
    return (
      <Card className={compact ? "p-4" : "p-5"}>
        <section aria-labelledby={headingId}>
          {header(
            <Badge variant="primary">
              <Crown className="h-3 w-3" aria-hidden="true" />
              {usage.isTrialing ? "Premium trial" : "Premium"}
            </Badge>,
          )}
          <p className="text-sm text-text-secondary">
            Unlimited CVs, cover letters and practice. AI is{" "}
            <span className="font-semibold text-text-primary">unlimited (fair use)</span>.
          </p>
          {fairUse.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                You're close to the fair-use limit for AI actions.
              </p>
              {fairUse.map((row) => (
                <UsageMeterBar
                  key={row.key}
                  label={row.label}
                  used={row.used}
                  limit={row.limit}
                  percent={row.percent}
                  tone={row.tone}
                  resetsAt={row.key === "monthly" ? usage.periodResetsAt : null}
                />
              ))}
            </div>
          )}
        </section>
      </Card>
    );
  }

  const rows = buildMeterRows(usage.meters, keys);
  const needsAttention = rows.some((row) => row.tone !== "ok");
  const resetLabel = formatResetDate(usage.periodResetsAt);

  return (
    <Card className={compact ? "p-4" : "p-5"}>
      <section aria-labelledby={headingId}>
        {header(<Badge variant="neutral">Free plan</Badge>)}
        <div className={`grid gap-4 ${compact ? "" : "sm:grid-cols-2 sm:gap-x-6"}`}>
          {rows.map((row) => (
            <UsageMeterBar
              key={row.key}
              label={row.label}
              used={row.used}
              limit={row.limit}
              percent={row.percent}
              tone={row.tone}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-text-tertiary">
            {resetLabel ? `Monthly allowances reset on ${resetLabel}.` : "Monthly allowances reset each month."}
          </p>
          <Link
            to="/app/billing"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
              needsAttention
                ? "bg-primary-600 text-white hover:bg-primary-700"
                : "text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/30"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {needsAttention ? "Upgrade for unlimited" : "See Premium"}
          </Link>
        </div>
      </section>
    </Card>
  );
}
