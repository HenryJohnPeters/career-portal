import type { UsageMeter } from "@careerportal/shared/types";

/** "7/10 AI uses left" for free users; nothing for Premium or while loading. */
export function AiUsesLeft({
  meter,
  isPremium,
  compact = false,
  className = "",
}: {
  meter: UsageMeter | null;
  isPremium: boolean;
  compact?: boolean;
  className?: string;
}) {
  if (isPremium || !meter || meter.limit === null) return null;
  const remaining = Math.max(0, meter.remaining ?? meter.limit - meter.used);
  return (
    <span
      className={`text-[10px] font-medium tabular-nums text-text-tertiary ${className}`}
      title={`${remaining} of ${meter.limit} free AI actions left this month`}
    >
      {remaining}/{meter.limit}
      {compact ? "" : " uses left"}
    </span>
  );
}
