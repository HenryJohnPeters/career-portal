import { useEffect, useId, useState } from "react";
import { ChevronDown, Clock, FileText, Send } from "lucide-react";
import type { TechnicalTest } from "@careerportal/shared/types";
import { Button } from "@careerportal/web/ui";
import { requestUpgradeForError, useSubmitTechnicalTest } from "@careerportal/web/data-access";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { ActionError } from "../../interview-prep/components/common";
import { useSubmissionDraft } from "../hooks/useSubmissionDraft";
import { countWords, formatDuration, getSoftTimer } from "../timer";
import { ScenarioBrief } from "./ScenarioBrief";
import { TestHeader } from "./TestHeader";

/** Matches the API's submission limit (PLAN §2.10). */
const MAX_SUBMISSION_LENGTH = 100_000;

const PLACEHOLDER = `Write your solution here…

Suggested structure:

## Approach
Your high-level approach and architectural decisions.

## Implementation
\`\`\`ts
// Key code
\`\`\`

## Trade-offs
What you traded off and why.

## Testing strategy
How you would test this.

## With more time
What you'd do next.`;

interface TechTestSessionProps {
  test: TechnicalTest;
  onBack: () => void;
}

/** An in-progress test: brief on demand, autosaved editor, soft timer, submit. */
export function TechTestSession({ test, onBack }: TechTestSessionProps) {
  const editorId = useId();
  const briefId = useId();
  const draft = useSubmissionDraft(test.id, test.submission ?? "");
  const submit = useSubmitTechnicalTest();
  const [showBrief, setShowBrief] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const words = countWords(draft.value);
  const trimmedLength = draft.value.trim().length;
  const tooLong = draft.value.length > MAX_SUBMISSION_LENGTH;

  const handleSubmit = () => {
    setConfirmSubmit(false);
    submit.mutate(
      { testId: test.id, submission: draft.value },
      {
        onSuccess: () => draft.clear(),
        onError: (err) => requestUpgradeForError(err),
      },
    );
  };

  return (
    <div className="w-full space-y-4">
      <TestHeader
        test={test}
        onBack={onBack}
        aside={<SoftTimer startedAt={test.startedAt} limitMinutes={test.timeLimit ?? null} />}
      />

      <div className="rounded-2xl border border-border bg-bg-elevated">
        <button
          type="button"
          onClick={() => setShowBrief((v) => !v)}
          aria-expanded={showBrief}
          aria-controls={briefId}
          className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <FileText className="h-4 w-4 text-violet-500" aria-hidden="true" />
            {showBrief ? "Hide the brief" : "Show the brief"}
          </span>
          <ChevronDown className={`h-4 w-4 text-text-tertiary transition-transform ${showBrief ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {showBrief && (
          <div id={briefId} className="border-t border-border p-4 max-h-[60vh] overflow-y-auto">
            <ScenarioBrief scenario={test.scenario} />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-bg-elevated overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 border-b border-border gap-1">
          <label htmlFor={editorId} className="text-xs font-bold uppercase tracking-widest text-text-secondary">
            Your solution
          </label>
          <p className="text-[11px] text-text-tertiary" aria-live="polite">
            {words} words ·{" "}
            {draft.status === "unavailable"
              ? "drafts can't be saved in this browser — keep a copy"
              : draft.status === "saved"
                ? "draft saved on this device"
                : "autosaves on this device"}
          </p>
        </div>
        <textarea
          id={editorId}
          value={draft.value}
          onChange={(e) => draft.update(e.target.value)}
          placeholder={PLACEHOLDER}
          maxLength={MAX_SUBMISSION_LENGTH}
          disabled={submit.isPending}
          aria-describedby={`${editorId}-hint`}
          className="w-full min-h-[50vh] sm:min-h-[60vh] p-4 sm:p-5 font-mono text-sm text-text-primary bg-transparent border-0 outline-none resize-y placeholder:text-text-tertiary/60"
          spellCheck={false}
        />
        <p id={`${editorId}-hint`} className="px-4 sm:px-5 py-2 border-t border-border text-[11px] text-text-tertiary">
          Explain your approach, show key code, discuss trade-offs and how you'd test it. Up to{" "}
          {MAX_SUBMISSION_LENGTH.toLocaleString()} characters ({draft.value.length.toLocaleString()} used).
        </p>
      </div>

      <ActionError error={submit.error} title="Couldn't submit your solution" />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <p className="text-xs text-text-secondary">
          After submitting you'll get an automated checklist of what your write-up covers, then rate yourself against the rubric.
        </p>
        <Button
          size="lg"
          onClick={() => setConfirmSubmit(true)}
          loading={submit.isPending}
          disabled={trimmedLength === 0 || tooLong}
          className="shrink-0"
        >
          <Send className="h-4 w-4" aria-hidden="true" /> Submit solution
        </Button>
      </div>

      <ConfirmDialog
        open={confirmSubmit}
        title="Submit your solution?"
        description="You can't edit it after submitting."
        confirmLabel="Submit"
        cancelLabel="Keep editing"
        onConfirm={handleSubmit}
        onCancel={() => setConfirmSubmit(false)}
      />
    </div>
  );
}

function SoftTimer({ startedAt, limitMinutes }: { startedAt: string | null; limitMinutes: number | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const timer = getSoftTimer(startedAt, limitMinutes, now);
  if (!timer) return null;

  return (
    <p
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold tabular-nums ${
        timer.overLimit
          ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300"
          : "border-border bg-bg-elevated text-text-secondary"
      }`}
      title="Advisory only — nothing is submitted automatically"
    >
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      {timer.limitMs === null
        ? `${formatDuration(timer.elapsedMs)} elapsed`
        : timer.overLimit
          ? `${formatDuration(timer.elapsedMs - timer.limitMs)} over the suggested ${limitMinutes} min`
          : `${formatDuration(timer.remainingMs ?? 0)} of ${limitMinutes} min left`}
    </p>
  );
}
