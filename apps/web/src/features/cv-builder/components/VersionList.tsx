import { useRef, useState } from "react";
import { Copy, FileText, FolderOpen, Pencil, Plus, PlusCircle, Star } from "lucide-react";
import { CV_LIMITS, type CvVersion } from "@careerportal/shared/types";
import {
  useCreateCvVersion,
  useDeleteCvVersion,
  useDuplicateCvVersion,
  useUpdateCvVersion,
} from "@careerportal/web/data-access";
import { Button, ConfirmDialog } from "@careerportal/web/ui";
import { useMountedRef } from "../../../lib/use-mounted-ref";
import { ItemCard, PremiumUpgradeBanner } from "../../shared";
import { usePlanStatus } from "../../ai-assist";

interface VersionListProps {
  versions: CvVersion[];
  /** Open the form straight away (e.g. /app/cv?new=1 from onboarding). */
  initialShowCreate?: boolean;
  onOpen: (id: string) => void;
}

/** All CV versions: open, create, rename, duplicate, set active, delete. */
export function VersionList({ versions, initialShowCreate = false, onOpen }: VersionListProps) {
  const plan = usePlanStatus();
  const createVersion = useCreateCvVersion();
  const updateVersion = useUpdateCvVersion();
  const duplicateVersion = useDuplicateCvVersion();
  const deleteVersion = useDeleteCvVersion();

  const atLimit = plan.isAtLimit("cvVersions", versions.length);
  const limit = plan.limitFor("cvVersions");
  const [showCreate, setShowCreate] = useState(initialShowCreate && !atLimit);
  const [newTitle, setNewTitle] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  // Escape unmounts the input, which can still fire blur (= submit) in some browsers.
  const renameCancelled = useRef(false);
  const [pendingDelete, setPendingDelete] = useState<CvVersion | null>(null);
  // Refs, not mutation state: a double click lands before the re-render.
  const creating = useRef(false);
  const duplicating = useRef(false);
  const mounted = useMountedRef();

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title || creating.current) return;
    creating.current = true;
    try {
      const res = await createVersion.mutateAsync({ title });
      // The user may have moved on while the request was in flight.
      if (!mounted.current) return;
      setNewTitle("");
      setShowCreate(false);
      onOpen(res.data.id);
    } catch {
      // Toasted (or the upgrade dialog opened) by the global handler; the form stays open.
    } finally {
      creating.current = false;
    }
  };

  const handleRename = async () => {
    if (!renaming || renameCancelled.current) return;
    const title = renaming.title.trim();
    const current = versions.find((v) => v.id === renaming.id);
    if (!title || title === current?.title) {
      setRenaming(null);
      return;
    }
    try {
      await updateVersion.mutateAsync({ id: renaming.id, title });
      setRenaming(null);
    } catch {
      // Toasted; keep the input so the user can fix it.
    }
  };

  const handleDuplicate = async (id: string) => {
    if (atLimit) {
      plan.promptUpgrade("cvVersions", versions.length);
      return;
    }
    if (duplicating.current) return;
    duplicating.current = true;
    try {
      const res = await duplicateVersion.mutateAsync(id);
      if (mounted.current) onOpen(res.data.id);
    } catch {
      // Toasted / upgrade dialog.
    } finally {
      duplicating.current = false;
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteVersion.mutateAsync(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      // Toasted; the dialog stays open so the user can retry or cancel.
    }
  };

  const openCreate = () => {
    if (atLimit) plan.promptUpgrade("cvVersions", versions.length);
    else setShowCreate(true);
  };

  return (
    <div className="space-y-4">
      {atLimit && !showCreate && (
        <PremiumUpgradeBanner
          message={`Free accounts can keep ${limit} CV versions. Upgrade for unlimited versions and the Tailor-for-this-job kit.`}
        />
      )}

      {versions.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-3">
            <FolderOpen className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-text-secondary">No CVs yet</p>
          <p className="text-xs text-text-tertiary mt-1">
            Create your first version below — you can paste your details and let AI structure it.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-label="CV versions">
          {versions.map((v) => {
            const sections = v.sections ?? [];
            const filled = sections.filter((s) => s.content.trim().length > 0).length;
            return (
              <li key={v.id}>
                <ItemCard
                  icon={FileText}
                  title={v.title}
                  subtitle={
                    sections.length > 0
                      ? `${filled}/${sections.length} sections filled`
                      : "No sections yet — click to start"
                  }
                  badge={v.isActive ? { label: "Active", variant: "success" } : undefined}
                  date={v.updatedAt}
                  isRenaming={renaming?.id === v.id}
                  renameValue={renaming?.title ?? ""}
                  onRenameChange={(title) =>
                    setRenaming({ id: v.id, title: title.slice(0, CV_LIMITS.versionTitle) })
                  }
                  onRenameSubmit={handleRename}
                  onRenameCancel={() => {
                    renameCancelled.current = true;
                    setRenaming(null);
                  }}
                  actions={[
                    ...(!v.isActive
                      ? [
                          {
                            icon: Star,
                            label: "Set as active CV",
                            onClick: () => updateVersion.mutate({ id: v.id, isActive: true }),
                            variant: "success" as const,
                          },
                        ]
                      : []),
                    {
                      icon: Copy,
                      label: atLimit ? "Duplicate (Premium)" : "Duplicate version",
                      onClick: () => void handleDuplicate(v.id),
                    },
                    {
                      icon: Pencil,
                      label: "Rename",
                      onClick: () => {
                        renameCancelled.current = false;
                        setRenaming({ id: v.id, title: v.title });
                      },
                    },
                  ]}
                  onDelete={() => setPendingDelete(v)}
                  onClick={() => onOpen(v.id)}
                />
              </li>
            );
          })}
        </ul>
      )}

      {showCreate ? (
        <form
          className="rounded-xl border border-accent/30 dark:border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5 p-4 space-y-3 animate-in fade-in"
          onSubmit={(e) => {
            e.preventDefault();
            void handleCreate();
          }}
        >
          <label
            htmlFor="new-cv-version-title"
            className="block text-xs font-semibold uppercase tracking-wider text-accent-dark dark:text-accent"
          >
            New CV version
          </label>
          <input
            id="new-cv-version-title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            maxLength={CV_LIMITS.versionTitle}
            placeholder="e.g. Software Engineer CV"
            className="w-full rounded-lg border border-accent/30 dark:border-accent/20 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" loading={createVersion.isPending} size="sm" disabled={!newTitle.trim()}>
              {!createVersion.isPending && <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
              Create
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreate(false);
                setNewTitle("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={openCreate}
          className={`w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-sm font-medium transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
            atLimit
              ? "border-gray-200 dark:border-gray-700 text-text-tertiary"
              : "border-accent/40 dark:border-accent/30 text-accent-dark dark:text-accent hover:border-accent hover:bg-accent/8 dark:hover:bg-accent/10"
          }`}
        >
          <PlusCircle className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" aria-hidden="true" />
          {atLimit ? "New version (Premium)" : "New version"}
        </button>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this CV version?"
        description={`"${pendingDelete?.title ?? ""}" and all its sections will be permanently deleted. Jobs linked to it will be unlinked.`}
        destructive
        loading={deleteVersion.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
