import {
  QUOTA_LABELS,
  meterPercent,
  type FairUseStatus,
  type QuotaKey,
  type UsageMeter,
} from "@careerportal/shared/types";

export type MeterTone = "ok" | "warning" | "exhausted";

export interface MeterRow {
  key: QuotaKey;
  label: string;
  used: number;
  /** null = unlimited */
  limit: number | null;
  /** 0-100, null when unlimited */
  percent: number | null;
  tone: MeterTone;
  /** Monthly allowances have a reset date; CV versions / cover letters are totals. */
  resetsAt: string | null;
}

/** Display order: monthly allowances first, then the totals. */
export const METER_ORDER: readonly QuotaKey[] = [
  "aiActions",
  "mockSessions",
  "questions",
  "techTests",
  "cvVersions",
  "coverLetters",
];

/** Share of a fair-use cap at which premium users start seeing the meter. */
export const FAIR_USE_VISIBLE_FROM = 80;

export function meterTone(percent: number | null): MeterTone {
  if (percent === null) return "ok";
  if (percent >= 100) return "exhausted";
  if (percent >= 80) return "warning";
  return "ok";
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function buildMeterRow(key: QuotaKey, meter: UsageMeter): MeterRow {
  const percent = meterPercent(meter);
  return {
    key,
    label: capitalize(QUOTA_LABELS[key]),
    used: meter.used,
    limit: meter.limit,
    percent,
    tone: meterTone(percent),
    resetsAt: meter.resetsAt,
  };
}

export function buildMeterRows(
  meters: Partial<Record<QuotaKey, UsageMeter>>,
  keys: readonly QuotaKey[] = METER_ORDER,
): MeterRow[] {
  const rows: MeterRow[] = [];
  for (const key of keys) {
    const meter = meters[key];
    if (meter) rows.push(buildMeterRow(key, meter));
  }
  return rows;
}

export interface FairUseRow {
  key: "daily" | "monthly";
  label: string;
  used: number;
  limit: number;
  percent: number;
  tone: MeterTone;
}

/** Premium fair-use meters worth showing (at or above FAIR_USE_VISIBLE_FROM %). */
export function visibleFairUseRows(fairUse: FairUseStatus | null | undefined): FairUseRow[] {
  if (!fairUse) return [];
  const candidates: Omit<FairUseRow, "percent" | "tone">[] = [
    { key: "daily", label: "AI actions today", used: fairUse.aiActionsToday, limit: fairUse.dailyLimit },
    { key: "monthly", label: "AI actions this month", used: fairUse.aiActionsThisMonth, limit: fairUse.monthlyLimit },
  ];
  return candidates
    .map((row) => {
      const percent = meterPercent({ used: row.used, limit: row.limit, remaining: null, resetsAt: null }) ?? 0;
      return { ...row, percent, tone: meterTone(percent) };
    })
    .filter((row) => row.percent >= FAIR_USE_VISIBLE_FROM);
}

/**
 * Short reset date ("1 Nov"). Allowances reset at UTC month boundaries, so
 * the date is formatted in UTC to show the boundary day itself.
 */
export function formatResetDate(
  iso: string | null | undefined,
  locale?: string,
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
