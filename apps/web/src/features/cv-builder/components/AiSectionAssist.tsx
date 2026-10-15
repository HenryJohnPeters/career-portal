import { useId, useState } from "react";
import { ChevronDown, Loader2, Sparkles, X } from "lucide-react";
import type { AiWritingAction } from "@careerportal/shared/types";
import { useAiGenerateCvSection } from "@careerportal/web/data-access";
import {
  AiActionGrid,
  AiLimitReachedCard,
  AiResultPreview,
  AiUsesLeft,
  EMPTY_AI_RESULT,
  aiErrorMessage,
  usePlanStatus,
} from "../../ai-assist";

const JOB_DESCRIPTION_MAX = 10_000;
const JOB_TITLE_MAX = 200;

interface AiSectionAssistProps {
  sectionId: string;
  sectionTitle: string;
  /** The editor text — the AI works on this, not the last saved copy. */
  currentContent: string;
  onApply: (content: string) => void;
  /** Called before each AI request (e.g. to save other pending edits used as context). */
  onBeforeGenerate?: () => void;
}

/** Generate / improve / tailor one CV section with AI. */
export function AiSectionAssist({
  sectionId,
  sectionTitle,
  currentContent,
  onApply,
  onBeforeGenerate,
}: AiSectionAssistProps) {
  const plan = usePlanStatus();
  const aiGenerate = useAiGenerateCvSection({ silent: true });
  const ids = useId();

  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<AiWritingAction | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasContent = currentContent.trim().length > 0;

  const handleGenerate = async (selected: AiWritingAction) => {
    setAction(selected);
    setResult(null);
    setError(null);
    onBeforeGenerate?.();
    try {
      const res = await aiGenerate.mutateAsync({
        sectionId,
        action: selected,
        jobTitle: jobTitle.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
        currentContent,
      });
      const content = typeof res.data?.content === "string" ? res.data.content.trim() : "";
      if (content) setResult(content);
      else setError(EMPTY_AI_RESULT);
    } catch (err) {
      setError(aiErrorMessage(err));
    }
  };

  const reset = () => {
    setResult(null);
    setAction(null);
    setError(null);
  };

  const close = () => {
    reset();
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-primary-500/20 bg-primary-500/5 px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-500/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        AI Assist
        <AiUsesLeft meter={plan.aiMeter} isPremium={plan.isPremium} compact />
      </button>
    );
  }

  if (!plan.hasAiUsesLeft && !result) {
    return <AiLimitReachedCard meter={plan.aiMeter} onClose={close} />;
  }

  return (
    <section
      aria-label={`AI assist for ${sectionTitle || "this section"}`}
      className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-600 text-white">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300 truncate">
            AI Assist — {sectionTitle || "Section"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AiUsesLeft meter={plan.aiMeter} isPremium={plan.isPremium} />
          <button
            type="button"
            onClick={close}
            aria-label="Close AI assist"
            className="rounded-md p-1 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {!result && !aiGenerate.isPending && (
        <>
          <div className="space-y-2">
            <label htmlFor={`${ids}-role`} className="sr-only">
              Target role (optional)
            </label>
            <input
              id={`${ids}-role`}
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              maxLength={JOB_TITLE_MAX}
              placeholder="Target role (e.g. Senior Frontend Engineer) — optional"
              className="w-full rounded-lg border border-accent-muted bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-dark focus:border-transparent"
            />
            <details className="group">
              <summary className="flex items-center gap-1 cursor-pointer text-[11px] font-medium text-accent-dark dark:text-accent select-none">
                <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" aria-hidden="true" />
                Add a job description for tailoring
              </summary>
              <label htmlFor={`${ids}-jd`} className="sr-only">
                Job description
              </label>
              <textarea
                id={`${ids}-jd`}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                maxLength={JOB_DESCRIPTION_MAX}
                placeholder="Paste the job description here…"
                rows={3}
                className="mt-2 w-full rounded-lg border border-accent-muted bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-dark focus:border-transparent resize-y"
              />
              <p className="text-right text-[10px] text-text-tertiary tabular-nums">
                {jobDescription.length.toLocaleString("en-GB")}/{JOB_DESCRIPTION_MAX.toLocaleString("en-GB")}
              </p>
            </details>
          </div>
          <AiActionGrid
            hasContent={hasContent}
            disabled={aiGenerate.isPending}
            onAction={(selected) => void handleGenerate(selected)}
            regenerateHint="Fresh content"
          />
        </>
      )}

      {aiGenerate.isPending && (
        <div className="flex items-center justify-center gap-2 py-6" role="status">
          <Loader2 className="h-5 w-5 text-accent-dark dark:text-accent animate-spin" aria-hidden="true" />
          <span className="text-xs font-medium text-accent-dark dark:text-accent">
            AI is writing your {(sectionTitle || "section").toLowerCase()}…
          </span>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 text-[11px] font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 underline"
          >
            Try again
          </button>
        </div>
      )}

      {result && (
        <AiResultPreview
          heading="AI-generated content"
          content={result}
          applyLabel="Apply to section"
          replacesText={hasContent}
          regenerating={aiGenerate.isPending}
          onApply={() => {
            onApply(result);
            close();
          }}
          onRegenerate={() => void handleGenerate(action ?? "generate")}
          onDiscard={reset}
        />
      )}
    </section>
  );
}
