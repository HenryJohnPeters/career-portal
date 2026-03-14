import { FileText, Star, Pencil, Trash2, Copy } from "lucide-react";
import type { CvVersion } from "@careerportal/shared/types";

interface VersionCardProps {
  version: CvVersion;
  isSelected: boolean;
  isRenaming: boolean;
  renameTitle: string;
  onSelect: (id: string) => void;
  onRenameChange: (value: string) => void;
  onRenameSubmit: (id: string) => void;
  onRenameCancel: () => void;
  onStartRename: (version: CvVersion) => void;
  onSetActive: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function VersionCard({
  version,
  isSelected,
  isRenaming,
  renameTitle,
  onSelect,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onStartRename,
  onSetActive,
  onDelete,
  onDuplicate,
}: VersionCardProps) {
  const sectionCount = version.sections?.length ?? 0;
  const filledCount =
    version.sections?.filter((s) => s.content.trim().length > 0).length ?? 0;

  return (
    <div
      onClick={() => onSelect(version.id)}
      className={`group relative rounded-xl border p-3 cursor-pointer transition-all duration-200 ${
        isSelected
          ? "border-accent bg-accent-muted/20 dark:bg-accent-muted/10 dark:border-accent shadow-sm shadow-accent/10 ring-1 ring-accent/20"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm bg-white dark:bg-gray-800/50"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isSelected
              ? "bg-accent text-white shadow-sm shadow-accent/30"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
          }`}
        >
          <FileText className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              value={renameTitle}
              onChange={(e) => onRenameChange(e.target.value)}
              onBlur={() => onRenameSubmit(version.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onRenameSubmit(version.id);
                if (e.key === "Escape") onRenameCancel();
              }}
              className="w-full rounded-md border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
              {version.title}
            </h3>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            {version.isActive && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            )}
            {sectionCount > 0 && (
              <span className="text-[9px] text-gray-400 dark:text-gray-500">
                {filledCount}/{sectionCount} sections
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div
        className={`flex items-center gap-0.5 mt-2.5 pt-2 border-t transition-all ${
          isSelected
            ? "border-accent-muted dark:border-accent-muted"
            : "border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {!version.isActive && (
          <button
            onClick={() => onSetActive(version.id)}
            className="rounded-md p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 transition-colors"
            title="Set as active CV"
          >
            <Star className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={() => onDuplicate(version.id)}
          className="rounded-md p-1.5 text-gray-400 hover:text-accent-dark hover:bg-accent-muted/20 dark:hover:bg-accent-muted/10 dark:hover:text-accent transition-colors"
          title="Duplicate version"
        >
          <Copy className="h-3 w-3" />
        </button>
        <button
          onClick={() => onStartRename(version)}
          className="rounded-md p-1.5 text-gray-400 hover:text-accent-dark hover:bg-accent-muted/20 dark:hover:bg-accent-muted/10 dark:hover:text-accent transition-colors"
          title="Rename"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={() => onDelete(version.id)}
          className="rounded-md p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors ml-auto"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
