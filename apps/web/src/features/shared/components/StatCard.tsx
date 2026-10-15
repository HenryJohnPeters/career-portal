import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
}

export function StatCard({ icon: Icon, value, label }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 flex items-center gap-3 transition-colors hover:border-accent/30 dark:hover:border-accent/20">
      <div
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-muted/60 dark:bg-accent-muted/40"
      >
        <Icon className="h-4 w-4 text-accent-600 dark:text-accent" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold text-gray-900 dark:text-white leading-none tracking-tight">{value}</p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wider font-medium">
          {label}
        </p>
      </div>
    </div>
  );
}
