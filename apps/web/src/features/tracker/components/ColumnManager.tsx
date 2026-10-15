import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  RotateCcw,
  Settings2,
  X,
} from "lucide-react";
import type { JobStatus } from "@careerportal/shared/types";
import { IconButton } from "@careerportal/web/ui";
import type { PipelineColumn } from "../constants";

interface ColumnManagerProps {
  visibleColumns: readonly PipelineColumn[];
  hiddenColumns: readonly PipelineColumn[];
  onRemove: (id: JobStatus) => void;
  onAdd: (id: JobStatus) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onReset: () => void;
}

/**
 * Show, hide and reorder board columns. Reordering works by dragging (mouse)
 * or with the move buttons (keyboard and touch); all controls stay visible.
 */
export function ColumnManager({
  visibleColumns,
  hiddenColumns,
  onRemove,
  onAdd,
  onMove,
  onReset,
}: ColumnManagerProps) {
  const [open, setOpen] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const resetDrag = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDrop = (toIdx: number) => (event: DragEvent) => {
    event.preventDefault();
    if (dragIdx !== null && dragIdx !== toIdx) onMove(dragIdx, toIdx);
    resetDrag();
  };

  const moveButton =
    "rounded p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";

  return (
    <div className="relative">
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
          open
            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
        }`}
      >
        <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
        Columns
        {hiddenColumns.length > 0 && (
          <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
            {hiddenColumns.length} hidden
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />

          <div
            id={panelId}
            role="region"
            aria-label="Board columns"
            className="absolute right-0 top-full mt-2 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Board columns</span>
              </div>
              <div className="flex items-center gap-1">
                <IconButton label="Reset columns" size="sm" onClick={onReset}>
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                </IconButton>
                <IconButton label="Close column settings" size="sm" onClick={close}>
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </IconButton>
              </div>
            </div>

            <div className="px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-1 mb-1.5">
                Shown ({visibleColumns.length})
              </p>
              <ul className="space-y-1">
                {visibleColumns.map((col, idx) => {
                  const Icon = col.icon;
                  return (
                    <li
                      key={col.id}
                      draggable
                      onDragStart={(event) => {
                        setDragIdx(idx);
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        setDragOverIdx(idx);
                      }}
                      onDrop={handleDrop(idx)}
                      onDragEnd={resetDrag}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                        dragIdx === idx
                          ? "opacity-40"
                          : dragOverIdx === idx
                            ? "bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-300 dark:ring-primary-700"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <GripVertical
                        className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing shrink-0"
                        aria-hidden="true"
                      />
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${col.color}`} aria-hidden="true" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex-1 truncate">
                        {col.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => onMove(idx, idx - 1)}
                        disabled={idx === 0}
                        className={moveButton}
                        aria-label={`Move ${col.label} up`}
                      >
                        <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMove(idx, idx + 1)}
                        disabled={idx === visibleColumns.length - 1}
                        className={moveButton}
                        aria-label={`Move ${col.label} down`}
                      >
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(col.id)}
                        disabled={visibleColumns.length <= 1}
                        className={`${moveButton} hover:text-red-600 dark:hover:text-red-400`}
                        aria-label={`Hide ${col.label}`}
                        title="Hide column"
                      >
                        <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {hiddenColumns.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-1 mb-1.5">
                  Hidden ({hiddenColumns.length})
                </p>
                <ul className="space-y-1">
                  {hiddenColumns.map((col) => {
                    const Icon = col.icon;
                    return (
                      <li key={col.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                        <Icon className={`h-3.5 w-3.5 shrink-0 opacity-50 ${col.color}`} aria-hidden="true" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-1 truncate">
                          {col.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => onAdd(col.id)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                          aria-label={`Show ${col.label}`}
                        >
                          <Plus className="h-3 w-3" aria-hidden="true" />
                          Show
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <p className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400">
              Drag or use the arrows to reorder. Hiding a column never deletes its applications.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
