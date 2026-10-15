import { useCallback, useId, useMemo, useState } from "react";
import type { Location } from "react-router-dom";
import { ArrowLeft, PenLine, Save, Undo2 } from "lucide-react";
import type { CoverLetter } from "@careerportal/shared/types";
import { useCvVersionSummaries, useJobs, useUpdateCoverLetter } from "@careerportal/web/data-access";
import { Button, ConfirmDialog } from "@careerportal/web/ui";
import { showToast } from "../../lib/toast";
import { SaveStatus } from "../cv-builder/components/SaveStatus";
import { useStoreSelector } from "../cv-builder/hooks/useStoreSelector";
import { useUnsavedChangesGuard } from "../cv-builder/hooks/useUnsavedChangesGuard";
import { AiCoverLetterAssist } from "./AiCoverLetterAssist";
import { CoverLetterAiTools } from "./CoverLetterAiTools";
import { CoverLetterExportBar } from "./CoverLetterExportBar";
import { TemplatesPanel } from "./TemplatesPanel";
import { ACTIVE_CV, type CvChoice } from "./cv-choice";
import { LETTER_BODY_MAX, LETTER_TITLE_MAX, type LetterFields } from "./letter-fields";
import { useCoverLetterDraft } from "./useCoverLetterDraft";

/** The editor stays mounted while the URL keeps this page and `?letter=`. */
function leavesLetter(current: Location, next: Location): boolean {
  return (
    current.pathname !== next.pathname ||
    new URLSearchParams(current.search).get("letter") !== new URLSearchParams(next.search).get("letter")
  );
}

interface Replacement {
  label: string;
  previous: LetterFields;
}

/**
 * One cover letter: autosaving editor, export, templates and AI. Rendered with
 * `key={letter.id}`. Leaving it first saves pending edits, and asks before
 * dropping edits that couldn't be saved.
 */
export function CoverLetterEditor({ letter, onClose }: { letter: CoverLetter; onClose: () => void }) {
  const ids = useId();
  const saver = useCoverLetterDraft(letter);
  const draft = useStoreSelector(saver, (s) => s.draft);
  const status = useStoreSelector(saver, (s) => s.status);
  const error = useStoreSelector(saver, (s) => s.error);
  const { data: cvData } = useCvVersionSummaries();
  const { data: jobsData } = useJobs();
  const linkJob = useUpdateCoverLetter();

  const [cvChoice, setCvChoice] = useState<CvChoice>(ACTIVE_CV);
  const [replacement, setReplacement] = useState<Replacement | null>(null);
  const [saving, setSaving] = useState(false);

  const cvVersions = cvData?.data ?? [];
  const jobs = useMemo(() => jobsData?.data ?? [], [jobsData]);
  const linkedJob = useMemo(() => {
    if (letter.jobId) {
      const job = jobs.find((j) => j.id === letter.jobId);
      if (job) return job;
    }
    return jobs.find((j) => j.coverLetterId === letter.id) ?? null;
  }, [jobs, letter.jobId, letter.id]);

  const flush = useCallback(() => saver.flush(), [saver]);
  const hasUnsaved = useCallback(() => saver.hasUnsavedChanges(), [saver]);
  const leaveGuard = useUnsavedChangesGuard(hasUnsaved, flush, leavesLetter);

  if (!draft) return null;
  const { title, body } = draft.fields;

  /** Replace the text (template / AI) with a one-step undo when it overwrites something. */
  const replace = (next: Partial<LetterFields>, label: string) => {
    if (body.trim() && next.body !== undefined && next.body !== body) {
      setReplacement({ label, previous: { title, body } });
    } else {
      setReplacement(null);
    }
    saver.edit(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (await saver.flush()) showToast("success", "Cover letter saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to letters
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="flex flex-col gap-4">
          <section
            aria-label="Cover letter editor"
            className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-muted text-accent">
                  <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">Editor</span>
              </div>
              <SaveStatus
                status={status}
                error={error}
                onRetry={() => void saver.flush()}
                idleLabel="Auto-saves as you type"
              />
            </div>

            <div>
              <label htmlFor={`${ids}-title`} className="sr-only">
                Letter title
              </label>
              <input
                id={`${ids}-title`}
                value={title}
                onChange={(e) => {
                  setReplacement(null);
                  saver.edit({ title: e.target.value });
                }}
                maxLength={LETTER_TITLE_MAX}
                aria-invalid={!title.trim() || undefined}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-800 transition-all"
                placeholder="Letter title, e.g. Acme — Frontend Engineer"
              />
            </div>

            {jobs.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor={`${ids}-job`} className="text-[11px] font-medium text-text-tertiary">
                  For job
                </label>
                <select
                  id={`${ids}-job`}
                  value={letter.jobId ?? ""}
                  disabled={linkJob.isPending}
                  onChange={(e) => linkJob.mutate({ id: letter.id, jobId: e.target.value || null })}
                  className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-text-secondary"
                >
                  <option value="">
                    {linkedJob && !letter.jobId
                      ? `${linkedJob.company} — ${linkedJob.role} (linked from the tracker)`
                      : "Not linked to a tracked job"}
                  </option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.company} — {job.role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor={`${ids}-body`} className="sr-only">
                Letter text
              </label>
              <textarea
                id={`${ids}-body`}
                value={body}
                onChange={(e) => {
                  // Typing makes the undo stale: it would also throw away the new text.
                  setReplacement(null);
                  saver.edit({ body: e.target.value });
                }}
                maxLength={LETTER_BODY_MAX}
                aria-describedby={`${ids}-count`}
                placeholder="Write your cover letter here, start from a template, or let the AI draft one…"
                className="min-h-[320px] w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-800 transition-all resize-y"
              />
              <p
                id={`${ids}-count`}
                className={`mt-1 text-right text-[11px] tabular-nums ${
                  body.length > LETTER_BODY_MAX * 0.9 ? "text-amber-600 dark:text-amber-400" : "text-text-tertiary"
                }`}
              >
                {body.length.toLocaleString("en-GB")}/{LETTER_BODY_MAX.toLocaleString("en-GB")} characters
              </p>
            </div>

            {replacement && (
              <div
                role="status"
                className="flex items-center justify-between gap-2 rounded-lg border border-primary-500/20 bg-primary-500/5 px-3 py-2 text-xs text-text-secondary"
              >
                <span>Replaced your letter with {replacement.label}.</span>
                <button
                  type="button"
                  onClick={() => {
                    saver.edit(replacement.previous);
                    setReplacement(null);
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-primary-700 dark:text-primary-300 hover:underline"
                >
                  <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Undo
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
              <Button size="sm" onClick={() => void handleSave()} loading={saving}>
                {!saving && <Save className="h-3.5 w-3.5" aria-hidden="true" />}
                Save
              </Button>
              <CoverLetterExportBar
                letterId={letter.id}
                title={title}
                body={body}
                cvVersions={cvVersions}
                prepare={flush}
              />
            </div>
          </section>

          <CoverLetterAiTools
            letterId={letter.id}
            body={body}
            cvChoice={cvChoice}
            onApplyRewrite={(text) => replace({ body: text }, "the rewritten version")}
          />
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto pb-4 pr-0.5">
          <TemplatesPanel
            onApply={(label, templateTitle, templateBody) =>
              replace(title.trim() ? { body: templateBody } : { title: templateTitle, body: templateBody }, label)
            }
          />
          <AiCoverLetterAssist
            letterId={letter.id}
            body={body}
            cvVersions={cvVersions}
            cvChoice={cvChoice}
            onCvChoiceChange={setCvChoice}
            linkedJob={linkedJob}
            onApply={(content) => replace({ body: content }, "the AI draft")}
          />
        </div>
      </div>

      <ConfirmDialog
        open={leaveGuard.blocked}
        title="Leave without saving?"
        description={`Your latest changes couldn't be saved${error ? `: ${error}` : ""}. If you leave now they'll be lost.`}
        confirmLabel="Leave anyway"
        cancelLabel="Stay and fix"
        onConfirm={leaveGuard.leave}
        onCancel={leaveGuard.stay}
      />
    </div>
  );
}
