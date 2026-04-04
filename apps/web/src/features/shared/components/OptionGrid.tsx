import type { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";

export interface OptionItem {
  key: string;
  icon: string;
  label: string;
  description?: string;
}

interface OptionGridProps<T extends string | number> {
  items: OptionItem[];
  value: T;
  onChange: (value: T) => void;
  columns?: string;
}

// Helper to get icon component from string name
function getIconComponent(iconName: string): LucideIcon {
  const candidate = (Icons as Record<string, unknown>)[iconName];
  return typeof candidate === "function"
    ? (candidate as LucideIcon)
    : Icons.HelpCircle;
}

export function OptionGrid<T extends string | number>({
  items,
  value,
  onChange,
  columns = "grid-cols-2 sm:grid-cols-4",
}: OptionGridProps<T>) {
  return (
    <div className={`grid ${columns} gap-3`}>
      {items.map((item) => {
        const selected = String(value) === item.key;
        const IconComponent = getIconComponent(item.icon);

        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key as T)}
            className={`group relative rounded-xl border-2 p-4 text-left transition-all duration-200 ${
              selected
                ? "border-primary-500 dark:border-primary-600 bg-primary-50 dark:bg-primary-950/30 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-950 ring-primary-400/30 shadow-md"
                : "border-border bg-bg-secondary hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center h-9 w-9 rounded-lg shrink-0 transition-colors ${
                  selected
                    ? "bg-primary-100 dark:bg-primary-900/40"
                    : "bg-bg-primary"
                }`}
              >
                <IconComponent
                  className={`h-5 w-5 transition-colors ${
                    selected
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-text-tertiary"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary mb-0.5">
                  {item.label}
                </p>
                {item.description && (
                  <p className="text-[11px] text-text-secondary leading-snug">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
            {selected && (
              <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary-600 dark:bg-primary-400 shadow-sm" />
            )}
          </button>
        );
      })}
    </div>
  );
}

interface SectionHeadingProps {
  icon: LucideIcon;
  label: string;
}

export function SectionHeading({ icon: Icon, label }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
      <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest">
        {label}
      </h2>
    </div>
  );
}
