import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { QuotaKey, UsageMeter } from "@careerportal/shared/types";
import { Alert, Button } from "@careerportal/web/ui";
import {
  getErrorMessage,
  isUpgradeError,
  requestUpgrade,
  requestUpgradeForError,
} from "@careerportal/web/data-access";
import { UsageMeterBar } from "../../../components/PlanUsageCard";
import { buildMeterRow } from "../../../lib/plan-usage";
import {
  SCORE_TONE_BAR,
  SCORE_TONE_TEXT,
  clampPercent,
  getLevelMeta,
  getTrackMeta,
  scoreTone,
} from "../meta";

/* Small presentational pieces shared by interview prep and technical tests. */

export interface Choice<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon: LucideIcon;
}

interface ChoiceGridProps<T extends string> {
  /** Visible group label (also the radio group's accessible name). */
  label: string;
  icon?: LucideIcon;
  choices: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: string;
  hint?: ReactNode;
}

/** A single-choice card grid built on native radio inputs (arrow keys, labels, focus all work). */
export function ChoiceGrid<T extends string>({
  label,
  icon: Icon,
  choices,
  value,
  onChange,
  columns = "grid-cols-2 sm:grid-cols-4",
  hint,
}: ChoiceGridProps<T>) {
  const name = useId();
  return (
    <fieldset>
      <legend className="flex items-center gap-2 mb-1 text-xs font-bold text-text-secondary uppercase tracking-widest">
        {Icon && <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />}
        {label}
      </legend>
      {hint && <p className="text-xs text-text-tertiary mb-2">{hint}</p>}
      <div className={`grid ${columns} gap-3 mt-2`}>
        {choices.map((choice) => {
          const checked = choice.value === value;
          const ChoiceIcon = choice.icon;
          return (
            <label
              key={choice.value}
              className={`relative flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg-primary ${
                checked
                  ? "border-primary-500 dark:border-primary-600 bg-primary-50 dark:bg-primary-950/30 shadow-sm"
                  : "border-border bg-bg-secondary hover:border-neutral-300 dark:hover:border-neutral-700"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={choice.value}
                checked={checked}
                onChange={() => onChange(choice.value)}
                className="sr-only"
              />
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  checked ? "bg-primary-100 dark:bg-primary-900/40" : "bg-bg-primary"
                }`}
                aria-hidden="true"
              >
                <ChoiceIcon
                  className={`h-5 w-5 ${checked ? "text-primary-600 dark:text-primary-400" : "text-text-tertiary"}`}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-text-primary">{choice.label}</span>
                {choice.description && (
                  <span className="block text-[11px] text-text-secondary leading-snug">{choice.description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 mb-3 text-xs font-bold text-text-secondary uppercase tracking-widest">
      <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />
      {children}
    </h2>
  );
}

export function TrackBadge({ track }: { track: string }) {
  const meta = getTrackMeta(track);
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg text-white ${meta.accent}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function LevelBadge({ level }: { level: string }) {
  const meta = getLevelMeta(level);
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${meta.badge}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

/** A small neutral chip with an icon, for metadata rows. */
export function MetaChip({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded-lg">
      <Icon className="h-3 w-3" aria-hidden="true" />
      {children}
    </span>
  );
}

interface ScoreBarProps {
  label: ReactNode;
  /** 0-100 */
  percentage: number;
  /** Shown on the right instead of the percentage, e.g. "7/10". */
  valueText?: string;
  size?: "sm" | "md";
}

/** A labelled, accessible score bar coloured by scoreTone. */
export function ScoreBar({ label, percentage, valueText, size = "sm" }: ScoreBarProps) {
  const labelId = useId();
  const pct = clampPercent(percentage);
  const tone = scoreTone(pct);
  return (
    <div>
      <div className="flex items-start justify-between gap-3 text-xs mb-1">
        <span id={labelId} className="text-text-secondary leading-snug">
          {label}
        </span>
        <span className={`font-semibold tabular-nums shrink-0 ${SCORE_TONE_TEXT[tone]}`}>{valueText ?? `${pct}%`}</span>
      </div>
      <div
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={valueText ?? `${pct}%`}
        className={`w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden ${size === "sm" ? "h-1.5" : "h-2"}`}
      >
        <div className={`h-full rounded-full transition-all duration-500 ${SCORE_TONE_BAR[tone]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

type ListTone = "emerald" | "amber" | "red" | "blue";

const LIST_TONES: Record<ListTone, { box: string; title: string; text: string }> = {
  emerald: {
    box: "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10",
    title: "text-emerald-700 dark:text-emerald-400",
    text: "text-emerald-800 dark:text-emerald-300",
  },
  amber: {
    box: "border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10",
    title: "text-amber-700 dark:text-amber-400",
    text: "text-amber-800 dark:text-amber-300",
  },
  red: {
    box: "border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10",
    title: "text-red-700 dark:text-red-400",
    text: "text-red-700 dark:text-red-300",
  },
  blue: {
    box: "border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10",
    title: "text-blue-700 dark:text-blue-400",
    text: "text-blue-800 dark:text-blue-300",
  },
};

/** A titled bullet list in a tinted box (strengths, missed points, suggestions…). */
export function BulletList({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  items: readonly string[] | null | undefined;
  tone: ListTone;
}) {
  const t = LIST_TONES[tone];
  if (!items || items.length === 0) return null;
  return (
    <section className={`rounded-2xl border p-4 ${t.box}`}>
      <h3 className={`text-[11px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${t.title}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
      </h3>
      <ul className="space-y-1 list-disc pl-4">
        {items.map((item, i) => (
          <li key={i} className={`text-sm leading-relaxed ${t.text}`}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Inline error for a failed action. Quota/premium errors also offer the
 * upgrade options (the dialog itself is opened by the caller).
 */
export function ActionError({
  error,
  title,
  onDismiss,
  className,
}: {
  error: unknown;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}) {
  if (!error) return null;
  const upgrade = isUpgradeError(error);
  return (
    <Alert
      variant={upgrade ? "warning" : "error"}
      title={title}
      className={className}
      action={
        upgrade || onDismiss ? (
          <div className="flex flex-wrap gap-2">
            {upgrade && (
              <Button size="sm" onClick={() => requestUpgradeForError(error)}>
                See upgrade options
              </Button>
            )}
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        ) : undefined
      }
    >
      {getErrorMessage(error)}
    </Alert>
  );
}

/** One plan-usage meter (e.g. this month's mock interviews) with its reset date. */
export function AllowanceMeter({ quota, meter }: { quota: QuotaKey; meter: UsageMeter }) {
  const { label, used, limit, percent, tone, resetsAt } = buildMeterRow(quota, meter);
  return <UsageMeterBar label={label} used={used} limit={limit} percent={percent} tone={tone} resetsAt={resetsAt} />;
}

/** Open the upgrade prompt for a used-up monthly allowance, with its numbers when known. */
export function requestQuotaUpgrade(quota: QuotaKey, meter?: UsageMeter | null): void {
  requestUpgrade({
    reason: "quota_exceeded",
    quota,
    limit: meter?.limit ?? undefined,
    used: meter?.used,
    resetsAt: meter?.resetsAt ?? null,
  });
}
