import { useRef, type KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";

export interface TabItem<K extends string> {
  key: K;
  label: string;
  icon: LucideIcon;
}

/**
 * ARIA tabs (tablist/tab, roving tabindex, arrow/Home/End keys). Panels use
 * `tabPanelProps(idPrefix, key)` for the matching id and aria-labelledby.
 */
export function TabBar<K extends string>({
  tabs,
  active,
  onChange,
  idPrefix,
  label,
  variant = "primary",
}: {
  tabs: readonly TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  idPrefix: string;
  label: string;
  variant?: "primary" | "secondary";
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | null = null;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    onChange(tabs[next].key);
    refs.current[next]?.focus();
  };

  const primary = variant === "primary";
  return (
    <div
      role="tablist"
      aria-label={label}
      className={
        primary
          ? "flex rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-1 gap-1 overflow-x-auto"
          : "flex rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-1 gap-1"
      }
    >
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        const selected = tab.key === active;
        return (
          <button
            key={tab.key}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.key}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.key}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`flex-1 flex items-center justify-center gap-1.5 font-medium transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
              primary
                ? `rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm ${
                    selected
                      ? "bg-primary-500/10 text-primary-700 dark:text-primary-300 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`
                : `rounded-md px-3 py-2 text-xs ${
                    selected
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`
            }`}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function tabPanelProps(idPrefix: string, key: string) {
  return {
    role: "tabpanel" as const,
    id: `${idPrefix}-panel-${key}`,
    "aria-labelledby": `${idPrefix}-tab-${key}`,
  };
}
