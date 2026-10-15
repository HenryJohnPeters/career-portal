import { useEffect, useId, useState } from "react";
import { BarChart3, ChevronDown, Crown, Lock } from "lucide-react";
import type { JobInsights } from "@careerportal/shared/types";
import { getErrorMessage, requestUpgrade, useJobInsights } from "@careerportal/web/data-access";
import { Button } from "@careerportal/web/ui";
import { readStorage, writeStorage } from "../../../lib/storage";
import {
  MIN_APPLICATIONS_FOR_RATES,
  buildCountSparkline,
  buildFunnelSteps,
  formatRate,
} from "../lib/insights";

const STORAGE_KEY = "tracker-insights-open";
const SPARK_W = 220;
const SPARK_H = 48;

/** Collapsible application insights above the board; the open/closed choice is remembered. */
export function InsightsStrip() {
  const panelId = useId();
  const [open, setOpen] = useState(() => readStorage(STORAGE_KEY) !== "0");
  const insights = useJobInsights(open);

  useEffect(() => {
    writeStorage(STORAGE_KEY, open ? "1" : "0");
  }, [open]);

  return (
    <section className="rounded-2xl border border-border bg-bg-elevated shadow-sm">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <BarChart3 className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          Insights
          <ChevronDown
            className={`ml-auto h-4 w-4 text-text-tertiary transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </h2>
      {open && (
        <div id={panelId} className="border-t border-border px-4 py-4">
          {insights.isPending ? (
            <div className="grid gap-4 md:grid-cols-3 animate-pulse motion-reduce:animate-none" role="status">
              <span className="sr-only">Loading insights</span>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-neutral-100 dark:bg-neutral-800/60" />
              ))}
            </div>
          ) : insights.isError ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary" role="alert">
              {getErrorMessage(insights.error, "Insights couldn't be loaded.")}
              <Button variant="outline" size="sm" onClick={() => void insights.refetch()}>
                Try again
              </Button>
            </div>
          ) : (
            <InsightsBody insights={insights.data.data} />
          )}
        </div>
      )}
    </section>
  );
}

function InsightsBody({ insights }: { insights: JobInsights }) {
  const { funnel, rates, weekly } = insights;
  const steps = buildFunnelSteps(funnel);
  const spark = buildCountSparkline(
    weekly.map((w) => w.count),
    SPARK_W,
    SPARK_H,
    3,
  );
  const weeklyTotal = weekly.reduce((sum, w) => sum + w.count, 0);
  const thisWeek = weekly[weekly.length - 1]?.count ?? 0;
  const fewApplications = funnel.applied < MIN_APPLICATIONS_FOR_RATES;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <p className="label">Funnel</p>
          <ul className="space-y-2">
            {steps.map((step) => (
              <li key={step.key}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-text-secondary">{step.label}</span>
                  <span className="font-semibold tabular-nums text-text-primary">{step.value}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary-500" style={{ width: `${step.percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
          {funnel.rejected > 0 && (
            <p className="mt-2 text-[11px] text-text-tertiary">{funnel.rejected} rejected so far — it's part of the process.</p>
          )}
        </div>

        <div>
          <p className="label">Rates</p>
          <dl className="grid grid-cols-3 gap-2">
            {[
              { label: "Response", value: rates.response },
              { label: "Interview", value: rates.interview },
              { label: "Offer", value: rates.offer },
            ].map((rate) => (
              <div key={rate.label} className="rounded-xl bg-bg-secondary px-2.5 py-2 text-center">
                <dt className="text-[11px] text-text-tertiary">{rate.label}</dt>
                <dd className="text-lg font-bold tabular-nums text-text-primary">{formatRate(rate.value)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[11px] text-text-tertiary">
            {fewApplications
              ? `Rates get more meaningful after ${MIN_APPLICATIONS_FOR_RATES} or more applications.`
              : "Share of your applications that reached each stage."}
          </p>
        </div>

        <div>
          <p className="label">Applications per week</p>
          <svg
            viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
            className="h-12 w-full text-primary-500"
            preserveAspectRatio="none"
            role="img"
            aria-label={`${weeklyTotal} applications in the last ${weekly.length} weeks, ${thisWeek} this week.`}
          >
            {spark.area && <path d={spark.area} className="fill-primary-500/10" />}
            {spark.line && (
              <path
                d={spark.line}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
          <p className="mt-1 text-[11px] text-text-tertiary">
            {weeklyTotal} in the last {weekly.length} weeks · {thisWeek} this week
          </p>
        </div>
      </div>

      {insights.locked || insights.byCvVersion === null ? <LockedCvBreakdown /> : <CvBreakdown rows={insights.byCvVersion} />}
    </div>
  );
}

function CvBreakdown({ rows }: { rows: NonNullable<JobInsights["byCvVersion"]> }) {
  return (
    <div>
      <p className="label">Which CV works best</p>
      {rows.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Link a CV version to your applications to compare how each one performs.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-text-tertiary">
                <th scope="col" className="py-1.5 pr-3 font-semibold">CV version</th>
                <th scope="col" className="py-1.5 px-3 font-semibold text-right">Applications</th>
                <th scope="col" className="py-1.5 px-3 font-semibold text-right">Responses</th>
                <th scope="col" className="py-1.5 pl-3 font-semibold text-right">Response rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.cvVersionId}>
                  <th scope="row" className="py-2 pr-3 text-left font-medium text-text-primary truncate max-w-[220px]">
                    {row.title}
                  </th>
                  <td className="py-2 px-3 text-right tabular-nums text-text-secondary">{row.applications}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-text-secondary">{row.responses}</td>
                  <td className="py-2 pl-3 text-right tabular-nums font-semibold text-text-primary">
                    {formatRate(row.responseRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Free plan: a teaser of the per-CV breakdown (decorative rows, no real data). */
function LockedCvBreakdown() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-border p-4">
      <div className="pointer-events-none select-none space-y-2 blur-[3px]" aria-hidden="true">
        {[68, 45, 30].map((width) => (
          <div key={width} className="flex items-center gap-3">
            <div className="h-3 w-28 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-2 flex-1 rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div className="h-2 rounded-full bg-primary-300 dark:bg-primary-700" style={{ width: `${width}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg-elevated/70 px-4 text-center">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          See which CV gets the most responses
        </p>
        <Button size="sm" onClick={() => requestUpgrade({ reason: "premium_required", feature: "insights" })}>
          <Crown className="h-3.5 w-3.5" aria-hidden="true" />
          Unlock with Premium
        </Button>
      </div>
    </div>
  );
}
