import type { JobFunnel } from "@careerportal/shared/types";

/** Rates below this many applications are too noisy to read much into. */
export const MIN_APPLICATIONS_FOR_RATES = 5;

/** API rates are whole percentages (0-100) or null when nothing was applied for. */
export function formatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return "—";
  return `${Math.round(Math.min(100, Math.max(0, rate)))}%`;
}

export interface FunnelStep {
  key: "applied" | "responded" | "interviewing" | "offers";
  label: string;
  value: number;
  /** Bar width: share of applied applications, 0-100. */
  percent: number;
}

export function buildFunnelSteps(funnel: JobFunnel): FunnelStep[] {
  const base = funnel.applied;
  const step = (key: FunnelStep["key"], label: string, value: number): FunnelStep => ({
    key,
    label,
    value,
    percent: base > 0 ? Math.round((Math.min(value, base) / base) * 100) : 0,
  });
  return [
    step("applied", "Applied", funnel.applied),
    step("responded", "Got a response", funnel.responded),
    step("interviewing", "Interviewed", funnel.interviewing),
    step("offers", "Offers", funnel.offers),
  ];
}

export interface Sparkline {
  /** SVG path for the line ("" when there is nothing to draw). */
  line: string;
  /** Closed SVG path for the area under the line. */
  area: string;
  points: { x: number; y: number; value: number }[];
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Sparkline for non-negative counts in a `width`×`height` box (y grows
 * downwards). The scale starts at 0 and tops out at the largest count (at
 * least 1, so an all-zero series is a flat line along the bottom).
 */
export function buildCountSparkline(
  values: readonly number[],
  width: number,
  height: number,
  padding = 2,
): Sparkline {
  if (values.length === 0 || width <= 0 || height <= 0) return { line: "", area: "", points: [] };
  const max = Math.max(1, ...values.map((v) => (Number.isFinite(v) ? v : 0)));
  const innerW = Math.max(0, width - padding * 2);
  const innerH = Math.max(0, height - padding * 2);
  const step = values.length > 1 ? innerW / (values.length - 1) : 0;

  const points = values.map((raw, index) => {
    const value = Number.isFinite(raw) ? Math.max(0, raw) : 0;
    return {
      x: round(padding + (values.length > 1 ? index * step : innerW / 2)),
      y: round(padding + innerH - (value / max) * innerH),
      value,
    };
  });
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const bottom = round(padding + innerH);
  const first = points[0];
  const last = points[points.length - 1];
  const area = `${line} L${last.x} ${bottom} L${first.x} ${bottom} Z`;
  return { line, area, points };
}
