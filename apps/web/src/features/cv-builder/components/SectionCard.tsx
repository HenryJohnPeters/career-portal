import { memo, type HTMLAttributes } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GripVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import type { CvSection } from "@careerportal/shared/types";

const ACTION_BUTTON =
  "rounded-md p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";

interface SectionCardProps {
  section: CvSection;
  index: number;
  totalSections: number;
  isCollapsed: boolean;
  moveDisabled: boolean;
  /** dnd-kit attributes + listeners for the drag handle (keyboard and pointer). */
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
  onStartEdit: (section: CvSection) => void;
  onDelete: (section: CvSection) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onToggleCollapse: (id: string) => void;
}

/** A section in read mode. Actions stay visible on touch screens and when focused. */
export const SectionCard = memo(function SectionCard({
  section,
  index,
  totalSections,
  isCollapsed,
  moveDisabled,
  dragHandleProps,
  isDragging,
  onStartEdit,
  onDelete,
  onMove,
  onToggleCollapse,
}: SectionCardProps) {
  const content = section.content.trim();
  const preview = content.length > 120 ? `${content.slice(0, 120)}…` : content;
  const label = section.title || `Section ${index + 1}`;

  return (
    <div
      className={`group rounded-xl border bg-white dark:bg-gray-800/50 transition-all duration-200 ${
        isDragging
          ? "border-accent shadow-2xl shadow-accent/20 scale-[1.02] opacity-90"
          : "border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-accent-muted dark:hover:border-accent-muted/60"
      }`}
    >
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          aria-label={`Reorder ${label} (drag, or press Space then use the arrow keys)`}
          className="touch-none flex items-center justify-center rounded-md p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onToggleCollapse(section.id)}
          aria-expanded={!isCollapsed}
          aria-label={`${isCollapsed ? "Show" : "Hide"} preview of ${label}`}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <ChevronRight
            className={`h-4 w-4 transition-transform duration-200 ${!isCollapsed ? "rotate-90" : ""}`}
            aria-hidden="true"
          />
        </button>

        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400"
          aria-hidden="true"
        >
          {index + 1}
        </span>

        <button
          type="button"
          onClick={() => onStartEdit(section)}
          className="flex-1 min-w-0 text-left rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label={`Edit ${label}`}
        >
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-accent-dark dark:group-hover:text-accent transition-colors truncate">
            {section.title}
          </h3>
        </button>

        {content ? (
          <span className="flex h-5 items-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2" title="Has content">
            <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
            <span className="sr-only">Has content</span>
          </span>
        ) : (
          <span className="flex h-5 items-center rounded-full bg-amber-50 dark:bg-amber-900/20 px-2 text-[10px] font-medium text-amber-700 dark:text-amber-400">
            Empty
          </span>
        )}

        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
          <button
            type="button"
            disabled={index === 0 || moveDisabled}
            onClick={() => onMove(section.id, "up")}
            className={ACTION_BUTTON}
            aria-label={`Move ${label} up`}
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={index === totalSections - 1 || moveDisabled}
            onClick={() => onMove(section.id, "down")}
            className={ACTION_BUTTON}
            aria-label={`Move ${label} down`}
            title="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onStartEdit(section)}
            className={ACTION_BUTTON}
            aria-label={`Edit ${label}`}
            title="Edit section"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(section)}
            className={`${ACTION_BUTTON} hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/20`}
            aria-label={`Delete ${label}`}
            title="Delete section"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <button
          type="button"
          onClick={() => onStartEdit(section)}
          tabIndex={-1}
          aria-hidden="true"
          className="block w-full text-left px-4 pb-3 pl-[88px] pr-4"
        >
          {content ? (
            <span className="block text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap line-clamp-3 leading-relaxed">
              {preview}
            </span>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400 italic flex items-center gap-1.5">
              <Pencil className="h-3 w-3" />
              Click to add content…
            </span>
          )}
        </button>
      )}
    </div>
  );
});
