import type { LucideIcon } from "lucide-react";
import { ArrowRight, Trash2 } from "lucide-react";

export interface ItemCardAction {
  icon: LucideIcon;
  /** Accessible name and tooltip. */
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
  /** Icon buttons in the footer */
  actions?: ItemCardAction[];
  /** Delete handler — renders a delete button in the footer */
  onDelete?: () => void;
  /** Opens the item: the title becomes a button that covers the whole card. */
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

const BADGE_STYLES = {
  success:
    "bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-500/20",
  neutral:
    "bg-gray-100 text-gray-600 ring-gray-500/10 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-500/20",
  warning:
    "bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/20",
} as const;

const ACTION_VARIANTS = {
  default:
    "text-gray-500 hover:text-accent-700 hover:bg-accent/10 dark:text-gray-400 dark:hover:text-accent dark:hover:bg-accent/10",
  danger:
    "text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20",
  success:
    "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-gray-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20",
} as const;

/*
 * Footer actions are always visible on touch screens and when the card has
 * keyboard focus; on devices that can hover they fade in on hover.
 */
const REVEAL =
  "opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 group-focus-within:opacity-100";

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

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
  return (
    <div className="group relative flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800/60 overflow-hidden transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-600/50 hover:shadow-lg hover:shadow-primary-500/5 focus-within:border-primary-400 dark:focus-within:border-primary-500/60">
      <div
        aria-hidden="true"
        className="h-[3px] bg-gradient-to-r from-primary-500/60 via-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />

      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-start gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-700/60 text-gray-500 dark:text-gray-400 group-hover:from-primary-50 group-hover:to-accent/10 group-hover:text-primary-600 dark:group-hover:from-primary-900/30 dark:group-hover:to-accent/10 dark:group-hover:text-primary-400 transition-all duration-200 shadow-sm ring-1 ring-gray-200/60 dark:ring-gray-600/40"
          >
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
                  aria-label="New name"
                  className="relative z-10 text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 w-full"
                  autoFocus
                />
              ) : (
                <h3 className="min-w-0 text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {onClick ? (
                    // The ::after overlay makes the whole card clickable while keeping one focusable button.
                    <button
                      type="button"
                      onClick={onClick}
                      className="block max-w-full truncate text-left after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary-500"
                    >
                      {title}
                    </button>
                  ) : (
                    <span className="block truncate">{title}</span>
                  )}
                </h3>
              )}
              {badge && (
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ring-1 shrink-0 ${
                    BADGE_STYLES[badge.variant]
                  }`}
                >
                  {badge.label}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{subtitle}</p>
            )}
          </div>
          {onClick && (
            <div
              aria-hidden="true"
              className="opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 pt-1"
            >
              <ArrowRight className="h-4 w-4 text-primary-400 dark:text-primary-500" />
            </div>
          )}
        </div>

        {meta && meta.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 ml-[52px]">
            {meta.map((m, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400 ring-1 ring-gray-200/50 dark:ring-gray-600/30"
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </div>

      {(date || actions?.length || onDelete) && (
        <div className="relative z-10 flex items-center gap-1 px-4 py-2.5 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30">
          {date && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tabular-nums flex-1">
              {DATE_FORMAT.format(new Date(date))}
            </span>
          )}
          <div className={`flex items-center gap-0.5 ml-auto transition-opacity duration-200 ${REVEAL}`}>
            {actions?.map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  aria-label={`${action.label}: ${title}`}
                  title={action.label}
                  className={`rounded-lg p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    ACTION_VARIANTS[action.variant ?? "default"]
                  }`}
                >
                  <ActionIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              );
            })}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label={`Delete ${title}`}
                title="Delete"
                className={`rounded-lg p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${ACTION_VARIANTS.danger}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
