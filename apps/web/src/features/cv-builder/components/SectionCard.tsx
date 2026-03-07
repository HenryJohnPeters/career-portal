import { useRef } from "react";
import {
  Pencil,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Save,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@careerportal/web/ui";
import type { CvSection } from "@careerportal/shared/types";
import { MarkdownToolbar } from "./MarkdownToolbar";
import { AiSectionAssist } from "./AiSectionAssist";

interface SectionCardProps {
  section: CvSection;
  index: number;
  totalSections: number;
  isEditing: boolean;
  isCollapsed: boolean;
  sectionEdits: { title: string; content: string };
  updatePending: boolean;
  autoSaveStatus: "idle" | "saving" | "saved";
  onEditChange: (edits: { title: string; content: string }) => void;
  onStartEdit: (section: CvSection) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onToggleCollapse: (id: string) => void;
  dragHandleProps?: Record<string, any>;
  isDragging?: boolean;
}

export function SectionCard({
  section,
  index,
  totalSections,
  isEditing,
  isCollapsed,
  sectionEdits,
  updatePending,
  autoSaveStatus,
  onEditChange,
  onStartEdit,
  onSave,
  onCancelEdit,
  onDelete,
  onMove,
  onToggleCollapse,
  dragHandleProps,
  isDragging,
}: SectionCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasContent = section.content.trim().length > 0;
  const contentPreview = section.content.trim().substring(0, 120);

  if (isEditing) {
    return (
      <div className="rounded-xl border-2 border-accent bg-white dark:bg-gray-800 shadow-xl shadow-accent/10 transition-all duration-200 overflow-hidden">
        {/* Edit header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-muted/30 dark:bg-accent-muted/20 text-accent-dark dark:text-accent">
              <Pencil className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent-dark dark:text-accent">
              Editing Section {index + 1}
            </span>
          </div>
          {/* Auto-save status */}
          <div className="flex items-center gap-2">
            {autoSaveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-accent animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving…
              </span>
            )}
            {autoSaveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-500">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 space-y-3">
          {/* Title input */}
          <input
            value={sectionEdits.title}
            onChange={(e) =>
              onEditChange({ ...sectionEdits, title: e.target.value })
            }
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-all"
            placeholder="Section title"
          />

          {/* Markdown toolbar + textarea */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent transition-all">
            <MarkdownToolbar
              textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
              value={sectionEdits.content}
              onChange={(val) =>
                onEditChange({ ...sectionEdits, content: val })
              }
            />
            <textarea
              ref={textareaRef}
              value={sectionEdits.content}
              onChange={(e) =>
                onEditChange({ ...sectionEdits, content: e.target.value })
              }
              rows={10}
              className="w-full bg-white dark:bg-gray-700/50 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-mono leading-relaxed focus:outline-none resize-y min-h-[180px]"
              placeholder="Write your section content here...&#10;&#10;Supports: **bold**, *italic*, - bullet lists, ### subheadings, [links](url)"
            />
          </div>

          {/* AI Assist */}
          <AiSectionAssist
            sectionId={section.id}
            sectionTitle={sectionEdits.title || section.title}
            sectionType={section.sectionType}
            hasContent={sectionEdits.content.trim().length > 0}
            onApply={(content) => onEditChange({ ...sectionEdits, content })}
          />

          {/* Formatting tips */}
          <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 dark:text-gray-500">
            <span className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5">
              **bold**
            </span>
            <span className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5">
              *italic*
            </span>
            <span className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5">
              - bullet list
            </span>
            <span className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5">
              ### subheading
            </span>
            <span className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5">
              [link](url)
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={onSave} loading={updatePending}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save & Close
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancelEdit}>
              <X className="h-3.5 w-3.5 mr-1.5" />
              Discard
            </Button>
            <div className="flex-1" />
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              Auto-saves as you type
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Collapsed / Read view ──
  return (
    <div
      className={`group rounded-xl border bg-white dark:bg-gray-800/50 transition-all duration-200 ${
        isDragging
          ? "border-accent shadow-2xl shadow-accent/20 scale-[1.02] rotate-1 opacity-90"
          : "border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-accent-muted dark:hover:border-accent-muted/60"
      }`}
    >
      <div className="flex items-center gap-2 p-3">
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="flex items-center justify-center rounded-md p-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => onToggleCollapse(section.id)}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <ChevronRight
            className={`h-4 w-4 transition-transform duration-200 ${
              !isCollapsed ? "rotate-90" : ""
            }`}
          />
        </button>

        {/* Section number badge */}
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400">
          {index + 1}
        </div>

        {/* Title & click to edit */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onStartEdit(section)}
        >
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-accent-dark dark:group-hover:text-accent transition-colors truncate">
            {section.title}
          </h3>
        </div>

        {/* Content filled indicator */}
        {hasContent ? (
          <div className="flex h-5 items-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2">
            <Check className="h-3 w-3 text-emerald-500" />
          </div>
        ) : (
          <div className="flex h-5 items-center rounded-full bg-amber-50 dark:bg-amber-900/20 px-2">
            <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400">
              Empty
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            disabled={index === 0}
            onClick={() => onMove(section.id, "up")}
            className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            disabled={index === totalSections - 1}
            onClick={() => onMove(section.id, "down")}
            className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onStartEdit(section)}
            className="rounded-md p-1.5 text-gray-400 hover:text-accent-dark hover:bg-accent-muted/20 dark:hover:bg-accent-muted/10 dark:hover:text-accent transition-colors"
            title="Edit section"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(section.id)}
            className="rounded-md p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
            title="Delete section"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded content preview */}
      {!isCollapsed && (
        <div
          className="px-4 pb-3 ml-[88px] mr-4 cursor-pointer animate-in slide-in-from-top-1 fade-in duration-150"
          onClick={() => onStartEdit(section)}
        >
          {hasContent ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap line-clamp-3 leading-relaxed">
              {contentPreview}
              {section.content.length > 120 && "…"}
            </p>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic flex items-center gap-1.5">
              <Pencil className="h-3 w-3" />
              Click to add content…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
