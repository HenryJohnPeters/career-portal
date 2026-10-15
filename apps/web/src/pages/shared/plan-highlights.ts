import { PLAN_FEATURES, type PlanFeatureKey, type PlanFeatureRow } from "@careerportal/shared/types";

export type PlanColumn = "free" | "premium";

/** "CV versions: 2", or just the label for an included yes/no feature. */
export function planFeatureText(row: PlanFeatureRow, plan: PlanColumn): string | null {
  const value = row[plan];
  if (value === false) return null;
  if (value === true) return row.label;
  return `${row.label}: ${value}`;
}

/** Selected PLAN_FEATURES rows as short lines for a plan card. */
export function planHighlights(plan: PlanColumn, keys: readonly PlanFeatureKey[]): string[] {
  return keys
    .map((key) => PLAN_FEATURES.find((row) => row.key === key))
    .map((row) => (row ? planFeatureText(row, plan) : null))
    .filter((text): text is string => text !== null);
}
