import { useEffect, useState } from "react";
import { FileSearch, Pencil, Plus } from "lucide-react";
import type { Job } from "@careerportal/shared/types";
import { getErrorMessage, requestUpgradeForError, useUpdateJob } from "@careerportal/web/data-access";
import { Alert, Button, TextareaField } from "@careerportal/web/ui";
import { useToast } from "../../../../lib/toast";
import { JOB_FORM_LIMITS } from "../../constants";
import { DrawerSection } from "./DrawerSection";

interface JobDescriptionSectionProps {
  job: Job;
  /** The description text: undefined while the full job is loading. */
  description: string | null | undefined;
  /** Why the description couldn't be loaded (null while loading or loaded). */
  loadError: string | null;
  onRetry: () => void;
  /** Reports unsaved edits so the drawer can warn before closing. */
  onUnsavedChange: (unsaved: boolean) => void;
}

/** View and edit the pasted job ad; it powers CV match and the Tailor kit. */
export function JobDescriptionSection({
  job,
  description,
  loadError,
  onRetry,
  onUnsavedChange,
}: JobDescriptionSectionProps) {
  const { mutateAsync, isPending } = useUpdateJob({ silent: true });
  const { toast } = useToast();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const editing = draft !== null;
  const saved = description ?? "";
  const unsaved = editing && draft.trim() !== saved.trim();

  useEffect(() => onUnsavedChange(unsaved), [unsaved, onUnsavedChange]);

  const loading = job.hasJobDescription && description === undefined;
  const skills = job.keySkills ?? [];

  const save = async () => {
    const text = (draft ?? "").trim();
    if (text.length > JOB_FORM_LIMITS.jobDescription) {
      setError(`Keep it to ${JOB_FORM_LIMITS.jobDescription.toLocaleString()} characters or fewer.`);
      return;
    }
    if (text === saved.trim()) {
      setDraft(null);
      return;
    }
    setError(null);
    try {
      await mutateAsync({ id: job.id, jobDescription: text || null });
      setDraft(null);
      toast("success", text ? "Job description saved." : "Job description removed.");
    } catch (err) {
      if (!requestUpgradeForError(err)) setError(getErrorMessage(err, "The description couldn't be saved."));
    }
  };

  return (
    <DrawerSection
      title="Job description"
      icon={FileSearch}
      aside={
        !editing && !loading && saved ? (
          <Button variant="ghost" size="sm" onClick={() => setDraft(saved)}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </Button>
        ) : undefined
      }
    >
      {loading && loadError ? (
        <Alert
          variant="error"
          action={
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          }
        >
          {loadError}
        </Alert>
      ) : loading ? (
        <div role="status" className="space-y-2 animate-pulse motion-reduce:animate-none">
          <span className="sr-only">Loading the job description</span>
          <div className="h-3 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-3 w-5/6 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-3 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
      ) : editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
          className="space-y-3"
        >
          {error && <Alert variant="error">{error}</Alert>}
          <TextareaField
            label="Job description"
            hideLabel
            rows={10}
            autoFocus
            value={draft}
            maxLength={JOB_FORM_LIMITS.jobDescription}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste the full job ad: responsibilities, requirements, nice-to-haves…"
            hint={`${draft.length.toLocaleString()} / ${JOB_FORM_LIMITS.jobDescription.toLocaleString()} characters`}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setDraft(null);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={isPending}>
              Save description
            </Button>
          </div>
        </form>
      ) : saved ? (
        <div
          tabIndex={0}
          role="region"
          aria-label="Job description text"
          className="max-h-64 overflow-y-auto rounded-xl border border-border bg-bg-secondary px-3.5 py-3 text-sm leading-relaxed text-text-secondary whitespace-pre-wrap break-words focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {saved}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center">
          <p className="text-sm text-text-secondary">
            Paste the job ad to check your CV against it and to use the Tailor kit.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setDraft("")}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add job description
          </Button>
        </div>
      )}

      {skills.length > 0 && !editing && (
        <div className="mt-3">
          <p className="label">Key skills</p>
          <ul className="flex flex-wrap gap-1.5" aria-label="Key skills">
            {skills.map((skill) => (
              <li
                key={skill}
                className="rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700 ring-1 ring-primary-200/60 dark:bg-primary-900/30 dark:text-primary-300 dark:ring-primary-700/40"
              >
                {skill}
              </li>
            ))}
          </ul>
        </div>
      )}
    </DrawerSection>
  );
}
