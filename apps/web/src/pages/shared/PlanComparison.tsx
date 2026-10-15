import { Check, Crown, Minus } from "lucide-react";
import { PLAN_FEATURES, PREMIUM_PRICE, type PlanFeatureRow } from "@careerportal/shared/types";
import type { PlanColumn } from "./plan-highlights";

function Value({ value, premium }: { value: string | boolean; premium: boolean }) {
  if (value === true) {
    return (
      <>
        <Check className={`h-4 w-4 ${premium ? "text-accent-700 dark:text-accent-400" : "text-emerald-600 dark:text-emerald-400"}`} aria-hidden="true" />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span>{value}</span>;
}

interface PlanComparisonProps {
  /** Marks the viewer's plan column. */
  current?: PlanColumn | null;
  className?: string;
}

/** The Free vs Premium table, generated from PLAN_FEATURES (the enforced limits). */
export function PlanComparison({ current = null, className = "" }: PlanComparisonProps) {
  const notes = PLAN_FEATURES.filter((row) => row.note);
  const noteNumber = (row: PlanFeatureRow) => notes.indexOf(row) + 1;

  const header = (plan: PlanColumn) => {
    const premium = plan === "premium";
    return (
      <th scope="col" className={`px-3 sm:px-4 py-3 align-bottom ${premium ? "bg-accent-50/60 dark:bg-accent-900/10" : ""}`}>
        <span className="flex items-center gap-1.5 text-sm font-bold text-text-primary">
          {premium && <Crown className="h-3.5 w-3.5 text-accent-700 dark:text-accent-400" aria-hidden="true" />}
          {premium ? "Premium" : "Free"}
        </span>
        <span className="block text-xs font-medium text-text-secondary">
          {premium ? `${PREMIUM_PRICE.label} / month` : "£0"}
        </span>
        {current === plan && (
          <span className="mt-1 inline-block rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            Your plan
          </span>
        )}
      </th>
    );
  };

  return (
    <div className={className}>
      <div className="overflow-x-auto rounded-2xl border border-border bg-bg-elevated shadow-sm">
        <table className="w-full text-left text-[13px]">
          <caption className="sr-only">What's included in the Free and Premium plans</caption>
          <thead className="border-b border-border">
            <tr>
              <th scope="col" className="w-[44%] px-3 sm:px-4 py-3 align-bottom text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">
                Feature
              </th>
              {header("free")}
              {header("premium")}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PLAN_FEATURES.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="px-3 sm:px-4 py-2.5 font-medium text-text-primary">
                  {row.label}
                  {row.note && (
                    <sup className="ml-0.5 text-text-tertiary" aria-hidden="true">
                      {noteNumber(row)}
                    </sup>
                  )}
                </th>
                <td className="px-3 sm:px-4 py-2.5 text-text-secondary">
                  <Value value={row.free} premium={false} />
                </td>
                <td className="px-3 sm:px-4 py-2.5 font-medium text-text-primary bg-accent-50/60 dark:bg-accent-900/10">
                  <Value value={row.premium} premium />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {notes.length > 0 && (
        <ol className="mt-2 space-y-1 text-xs text-text-tertiary">
          {notes.map((row) => (
            <li key={row.key}>
              <span aria-hidden="true">{noteNumber(row)}. </span>
              {row.label}: {row.note}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
