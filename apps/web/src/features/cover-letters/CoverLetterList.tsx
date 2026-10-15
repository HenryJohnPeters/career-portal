import { useRef, useState } from "react";
import { FolderOpen, Mail, Plus, PlusCircle } from "lucide-react";
import type { CoverLetter } from "@careerportal/shared/types";
import { useCreateCoverLetter, useDeleteCoverLetter } from "@careerportal/web/data-access";
import { Button, ConfirmDialog } from "@careerportal/web/ui";
import { useMountedRef } from "../../lib/use-mounted-ref";
import { ItemCard, PremiumUpgradeBanner } from "../shared";
import { usePlanStatus } from "../ai-assist";
import { LETTER_TITLE_MAX } from "./letter-fields";

interface CoverLetterListProps {
  letters: CoverLetter[];
  /** Open the create form straight away (e.g. /app/cover-letters?new=1). */
  initialShowCreate?: boolean;
  onOpen: (id: string) => void;
}

export function CoverLetterList({ letters, initialShowCreate = false, onOpen }: CoverLetterListProps) {
  const plan = usePlanStatus();
  const createLetter = useCreateCoverLetter();
  const deleteLetter = useDeleteCoverLetter();
  const atLimit = plan.isAtLimit("coverLetters", letters.length);
  const limit = plan.limitFor("coverLetters");

  const [showCreate, setShowCreate] = useState(initialShowCreate && !atLimit);
  const [newTitle, setNewTitle] = useState("");
  const [pendingDelete, setPendingDelete] = useState<CoverLetter | null>(null);
  // A ref, not mutation state: a double click lands before the re-render.
  const creating = useRef(false);
  const mounted = useMountedRef();

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title || creating.current) return;
    creating.current = true;
    try {
      const res = await createLetter.mutateAsync({ title });
      // The user may have moved on while the request was in flight.
      if (!mounted.current) return;
      setNewTitle("");
      setShowCreate(false);
      onOpen(res.data.id);
    } catch {
      // Toasted (or the upgrade dialog opened) by the global handler.
    } finally {
      creating.current = false;
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteLetter.mutateAsync(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      // Toasted; the dialog stays open to retry.
    }
  };

  const openCreate = () => {
    if (atLimit) plan.promptUpgrade("coverLetters", letters.length);
    else setShowCreate(true);
  };

  return (
    <div className="space-y-4">
      {atLimit && !showCreate && (
        <PremiumUpgradeBanner
          message={`Free accounts can keep ${limit} cover letters. Upgrade for unlimited letters and the Tailor-for-this-job kit.`}
        />
      )}

      {letters.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-3">
            <FolderOpen className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-text-secondary">No cover letters yet</p>
          <p className="text-xs text-text-tertiary mt-1">Create one below — start from a template or let AI draft it.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-label="Cover letters">
          {letters.map((letter) => (
            <li key={letter.id}>
              <ItemCard
                icon={Mail}
                title={letter.title}
                subtitle={
                  letter.body?.trim()
                    ? `${letter.body.trim().slice(0, 80)}${letter.body.trim().length > 80 ? "…" : ""}`
                    : "Empty — click to start writing"
                }
                meta={letter.job ? [`${letter.job.company} — ${letter.job.role}`] : undefined}
                date={letter.updatedAt}
                onDelete={() => setPendingDelete(letter)}
                onClick={() => onOpen(letter.id)}
              />
            </li>
          ))}
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
            htmlFor="new-cover-letter-title"
            className="block text-xs font-semibold uppercase tracking-wider text-accent-dark dark:text-accent"
          >
            New cover letter
          </label>
          <input
            id="new-cover-letter-title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            maxLength={LETTER_TITLE_MAX}
            placeholder="e.g. Google SWE application"
            className="w-full rounded-lg border border-accent/30 dark:border-accent/20 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" loading={createLetter.isPending} size="sm" disabled={!newTitle.trim()}>
              {!createLetter.isPending && <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
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
          {atLimit ? "New cover letter (Premium)" : "New cover letter"}
        </button>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this cover letter?"
        description={`"${pendingDelete?.title ?? ""}" will be permanently deleted. Jobs linked to it will be unlinked.`}
        destructive
        loading={deleteLetter.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
