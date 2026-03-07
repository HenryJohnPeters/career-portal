import { Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EmptyFeatureStateProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
}

export function EmptyFeatureState({
  icon: Icon = Sparkles,
  title,
  subtitle,
}: EmptyFeatureStateProps) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted mb-3">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
