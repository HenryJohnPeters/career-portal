import { useState } from "react";
import {
  Settings2,
  X,
  Plus,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import type { PipelineColumn, PipelineStatus } from "../constants";

interface ColumnManagerProps {
  visibleColumns: PipelineColumn[];
  hiddenColumns: PipelineColumn[];
  onRemove: (id: PipelineStatus) => void;
  onAdd: (id: PipelineStatus, atIndex?: number) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onReset: () => void;
}

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

  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  };

  const handleDrop = (toIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== toIdx) {
      onMove(dragIdx, toIdx);
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-150 ${
          open
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm shadow-blue-500/10"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
        }`}
        aria-label="Manage columns"
      >
        <Settings2 className="h-3.5 w-3.5" />
        Columns
        {hiddenColumns.length > 0 && (
          <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
            {hiddenColumns.length} hidden
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Board Columns
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={onReset}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Reset to defaults"
                  title="Reset to defaults"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Visible columns (reorderable) */}
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1 mb-1.5">
                Visible ({visibleColumns.length})
              </p>
              <div className="space-y-1">
                {visibleColumns.map((col, idx) => {
                  const Icon = col.icon;
                  const isLast = idx === visibleColumns.length - 1;
                  const isFirst = idx === 0;
                  const isDragging = dragIdx === idx;
                  const isDragOver = dragOverIdx === idx;

                  return (
                    <div
                      key={col.id}
                      draggable
                      onDragStart={handleDragStart(idx)}
                      onDragOver={handleDragOver(idx)}
                      onDrop={handleDrop(idx)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 group transition-all duration-100 ${
                        isDragging
                          ? "opacity-40"
                          : isDragOver
                          ? "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-300 dark:ring-blue-700"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <GripVertical className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing shrink-0" />
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${col.color}`} />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex-1 truncate">
                        {col.label}
                      </span>

                      {/* Move up */}
                      <button
                        onClick={() => !isFirst && onMove(idx, idx - 1)}
                        disabled={isFirst}
                        className="rounded p-0.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors opacity-0 group-hover:opacity-100"
                        aria-label={`Move ${col.label} up`}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>

                      {/* Move down */}
                      <button
                        onClick={() => !isLast && onMove(idx, idx + 1)}
                        disabled={isLast}
                        className="rounded p-0.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors opacity-0 group-hover:opacity-100"
                        aria-label={`Move ${col.label} down`}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => onRemove(col.id)}
                        disabled={visibleColumns.length <= 1}
                        className="rounded p-0.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors opacity-0 group-hover:opacity-100"
                        aria-label={`Hide ${col.label}`}
                        title="Hide column"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hidden columns (re-addable) */}
            {hiddenColumns.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1 mb-1.5">
                  <EyeOff className="h-3 w-3 inline mr-1" />
                  Hidden ({hiddenColumns.length})
                </p>
                <div className="space-y-1">
                  {hiddenColumns.map((col) => {
                    const Icon = col.icon;
                    return (
                      <div
                        key={col.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors"
                      >
                        <Icon
                          className={`h-3.5 w-3.5 shrink-0 opacity-40 ${col.color}`}
                        />
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 flex-1 truncate">
                          {col.label}
                        </span>
                        <button
                          onClick={() => onAdd(col.id)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label={`Show ${col.label}`}
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer hint */}
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Drag to reorder · Hidden columns' cards stay safe
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
