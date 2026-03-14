import type { LucideIcon } from "lucide-react";

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

export function OptionGrid<T extends string | number>({
  items,
  value,
  onChange,
  columns = "grid-cols-2 sm:grid-cols-4",
}: OptionGridProps<T>) {
  return (
    <div className={`grid ${columns} gap-3`}>
      {items.map((item) => {
        const selected = value === (item.key as unknown as T);
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key as unknown as T)}
            className={`group relative rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
              selected
                ? "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-950 ring-blue-400/30 shadow-md"
                : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm"
            }`}
          >
            <span className="text-2xl block mb-2">{item.icon}</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {item.label}
            </p>
            {item.description && (
              <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-0.5 leading-snug">
                {item.description}
              </p>
            )}
            {selected && (
              <div className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-primary-600" />
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
      <Icon className="h-4 w-4 text-accent" />
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
        {label}
      </h2>
    </div>
  );
}
