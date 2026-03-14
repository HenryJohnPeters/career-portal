import { Plus, PlusCircle, FolderOpen, Crown } from "lucide-react";
import { Button } from "@careerportal/web/ui";
import type { CvVersion } from "@careerportal/shared/types";
import { VersionCard } from "./VersionCard";

const FREE_CV_LIMIT = 1;

interface VersionSidebarProps {
  versions: CvVersion[];
  selectedVersionId: string | null;
  showCreateVersion: boolean;
  newVersionTitle: string;
  createVersionPending: boolean;
  renamingVersionId: string | null;
  renameTitle: string;
  isPremium?: boolean;
  onSelectVersion: (id: string) => void;
  onNewVersionTitleChange: (value: string) => void;
  onShowCreateVersion: (show: boolean) => void;
  onCreateVersion: () => void;
  onRenameTitleChange: (value: string) => void;
  onRenameSubmit: (id: string) => void;
  onRenameCancel: () => void;
  onStartRename: (version: CvVersion) => void;
  onSetActive: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function VersionSidebar({
  versions,
  selectedVersionId,
  showCreateVersion,
  newVersionTitle,
  createVersionPending,
  renamingVersionId,
  renameTitle,
  isPremium = false,
  onSelectVersion,
  onNewVersionTitleChange,
  onShowCreateVersion,
  onCreateVersion,
  onRenameTitleChange,
  onRenameSubmit,
  onRenameCancel,
  onStartRename,
  onSetActive,
  onDelete,
  onDuplicate,
}: VersionSidebarProps) {
  const atFreeLimit = !isPremium && versions.length >= FREE_CV_LIMIT;

  return (
    <div className="space-y-4">
      {atFreeLimit && !showCreateVersion && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-3 flex items-start gap-2">
          <Crown className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-relaxed">
            Free accounts are limited to {FREE_CV_LIMIT} CV. Upgrade to Premium
            for unlimited CVs.
          </p>
        </div>
      )}

      {showCreateVersion ? (
        <div className="rounded-xl border border-accent-muted dark:border-accent-muted bg-gradient-to-br from-accent-muted/30 to-accent-muted/10 dark:from-accent-muted/10 dark:to-accent-muted/5 p-4 space-y-3 animate-in fade-in">
          <label className="block text-xs font-semibold uppercase tracking-wider text-accent-dark dark:text-accent">
            New CV Version
          </label>
          <input
            value={newVersionTitle}
            onChange={(e) => onNewVersionTitleChange(e.target.value)}
            placeholder="e.g. Software Engineer CV"
            className="w-full rounded-lg border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
            onKeyDown={(e) => e.key === "Enter" && onCreateVersion()}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              onClick={onCreateVersion}
              loading={createVersionPending}
              size="sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onShowCreateVersion(false);
                onNewVersionTitleChange("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => !atFreeLimit && onShowCreateVersion(true)}
          disabled={atFreeLimit}
          className={`w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-sm font-medium transition-all duration-200 group ${
            atFreeLimit
              ? "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
              : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-accent hover:text-accent-dark dark:hover:text-accent hover:bg-accent-muted/10"
          }`}
        >
          <PlusCircle className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
          New Version
        </button>
      )}

      {versions.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-3">
            <FolderOpen className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            No versions yet
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
            Create your first version
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {versions.map((v) => (
            <VersionCard
              key={v.id}
              version={v}
              isSelected={selectedVersionId === v.id}
              isRenaming={renamingVersionId === v.id}
              renameTitle={renameTitle}
              onSelect={onSelectVersion}
              onRenameChange={onRenameTitleChange}
              onRenameSubmit={onRenameSubmit}
              onRenameCancel={onRenameCancel}
              onStartRename={onStartRename}
              onSetActive={onSetActive}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
