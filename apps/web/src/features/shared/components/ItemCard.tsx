import type { LucideIcon } from "lucide-react";
import { Trash2, ArrowRight } from "lucide-react";

export interface ItemCardAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger" | "success";
}

interface ItemCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Optional status badge (e.g. "Active") */
  badge?: { label: string; variant: "success" | "neutral" | "warning" };
  /** Optional metadata displayed as chips beneath the title */
  meta?: string[];
  /** Date string shown in the footer */
  date?: string;
  /** Action buttons shown in the footer on hover */
  actions?: ItemCardAction[];
  /** Delete handler — renders a delete button in the footer */
  onDelete?: () => void;
  /** Click handler for the whole card */
  onClick?: () => void;
  /** When true, shows an inline rename input instead of the title */
  isRenaming?: boolean;
  /** Current value of the rename input */
  renameValue?: string;
  /** Called when the rename input value changes */
  onRenameChange?: (value: string) => void;
  /** Called when the user submits the rename (Enter / blur) */
  onRenameSubmit?: () => void;
  /** Called when the user cancels renaming (Escape) */
  onRenameCancel?: () => void;
}

export function ItemCard({
  icon: Icon,
  title,
  subtitle,
  badge,
  meta,
  date,
  actions,
  onDelete,
  onClick,
  isRenaming,
  renameValue,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}: ItemCardProps) {
  const badgeStyles = {
    success:
      "bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-500/20",
    neutral:
      "bg-gray-100 text-gray-600 ring-gray-500/10 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-500/20",
    warning:
      "bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/20",
  };

  const actionVariants = {
    default:
      "text-gray-400 hover:text-accent hover:bg-accent/10 dark:hover:text-accent dark:hover:bg-accent/10",
    danger:
      "text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20",
    success:
      "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20",
  };

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800/60 overflow-hidden cursor-pointer transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-600/50 hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/5 hover:-translate-y-0.5"
    >
      {/* Top gradient accent bar */}
      <div className="h-[3px] bg-gradient-to-r from-primary-500/60 via-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex flex-col flex-1 p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-700/60 text-gray-500 dark:text-gray-400 group-hover:from-primary-50 group-hover:to-accent/10 group-hover:text-primary-600 dark:group-hover:from-primary-900/30 dark:group-hover:to-accent/10 dark:group-hover:text-primary-400 transition-all duration-200 shadow-sm ring-1 ring-gray-200/60 dark:ring-gray-600/40 group-hover:ring-primary-200/60 dark:group-hover:ring-primary-700/40">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2">
              {isRenaming ? (
                <input
                  value={renameValue}
                  onChange={(e) => onRenameChange?.(e.target.value)}
                  onBlur={onRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onRenameSubmit?.();
                    if (e.key === "Escape") onRenameCancel?.();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 w-full"
                  autoFocus
                />
              ) : (
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                  {title}
                </h3>
              )}
              {badge && (
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ring-1 shrink-0 ${
                    badgeStyles[badge.variant]
                  }`}
                >
                  {badge.variant === "success" && (
                    <span className="h-1 w-1 rounded-full bg-current animate-pulse" />
                  )}
                  {badge.label}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {/* Open arrow — appears on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 pt-1">
            <ArrowRight className="h-4 w-4 text-primary-400 dark:text-primary-500" />
          </div>
        </div>

        {/* Meta chips */}
        {meta && meta.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 ml-[52px]">
            {meta.map((m, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 ring-1 ring-gray-200/50 dark:ring-gray-600/30"
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {(date || actions?.length || onDelete) && (
        <div
          className="flex items-center gap-1 px-4 py-2.5 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30"
          onClick={(e) => e.stopPropagation()}
        >
          {date && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tabular-nums flex-1">
              {new Date(date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
            {actions?.map((action, i) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={i}
                  onClick={action.onClick}
                  className={`rounded-lg p-1.5 transition-colors ${
                    actionVariants[action.variant ?? "default"]
                  }`}
                  title={action.label}
                >
                  <ActionIcon className="h-3.5 w-3.5" />
                </button>
              );
            })}
            {onDelete && (
              <button
                onClick={onDelete}
                className={`rounded-lg p-1.5 transition-colors ${actionVariants.danger} ml-auto`}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
