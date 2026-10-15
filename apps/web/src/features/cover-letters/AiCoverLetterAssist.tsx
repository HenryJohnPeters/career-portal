import { useEffect, useId, useState } from "react";
import { ChevronDown, FileText, Loader2, Sparkles } from "lucide-react";
import type { AiWritingAction, CoverLetterTone, CvVersionSummary, Job } from "@careerportal/shared/types";
import { useAiGenerateCoverLetter } from "@careerportal/web/data-access";
import {
  AiActionGrid,
  AiLimitReachedCard,
  AiResultPreview,
  AiUsesLeft,
  EMPTY_AI_RESULT,
  aiErrorMessage,
  usePlanStatus,
} from "../ai-assist";
import { ACTIVE_CV, NO_CV, cvChoiceToRequest, type CvChoice } from "./cv-choice";

const SHORT_MAX = 200;
const URL_MAX = 500;
const JOB_DESCRIPTION_MAX = 10_000;

const inputClass =
  "w-full rounded-lg border border-accent-muted bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-dark focus:border-transparent";

interface AiCoverLetterAssistProps {
  letterId: string;
  /** The editor text — Improve/Tailor work on this, not the last saved copy. */
  body: string;
  cvVersions: readonly CvVersionSummary[];
  cvChoice: CvChoice;
  onCvChoiceChange: (choice: CvChoice) => void;
  /** The tracked job this letter is for; its details pre-fill the form. */
  linkedJob: Pick<Job, "id" | "company" | "role" | "url" | "hasJobDescription"> | null;
  onApply: (content: string) => void;
}

/** AI cover-letter generator: write from scratch, improve, or tailor to a job. */
export function AiCoverLetterAssist({
  letterId,
  body,
  cvVersions,
  cvChoice,
  onCvChoiceChange,
  linkedJob,
  onApply,
}: AiCoverLetterAssistProps) {
  const plan = usePlanStatus();
  const aiGenerate = useAiGenerateCoverLetter({ silent: true });
  const ids = useId();

  const [action, setAction] = useState<AiWritingAction | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<CoverLetterTone>("professional");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill empty fields when a job is linked (the API also reads its description).
  const linkedJobId = linkedJob?.id;
  useEffect(() => {
    if (!linkedJob) return;
    setJobTitle((v) => v || linkedJob.role.slice(0, SHORT_MAX));
    setCompanyName((v) => v || linkedJob.company.slice(0, SHORT_MAX));
    setCompanyUrl((v) => v || (linkedJob.url ?? "").slice(0, URL_MAX));
    // Only when the link changes, not on every refetch of the job list.
  }, [linkedJobId]);

  const hasBody = body.trim().length > 0;

  const handleGenerate = async (selected: AiWritingAction) => {
    setAction(selected);
    setResult(null);
    setError(null);
    try {
      const res = await aiGenerate.mutateAsync({
        id: letterId,
        action: selected,
        jobTitle: jobTitle.trim() || undefined,
        companyName: companyName.trim() || undefined,
        companyUrl: companyUrl.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
        tone,
        currentBody: body,
        ...cvChoiceToRequest(cvChoice),
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

  if (!plan.hasAiUsesLeft && !result) {
    return <AiLimitReachedCard meter={plan.aiMeter} />;
  }

  return (
    <section
      aria-labelledby={`${ids}-heading`}
      className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <h3 id={`${ids}-heading`} className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
            AI cover letter writer
          </h3>
        </div>
        <AiUsesLeft meter={plan.aiMeter} isPremium={plan.isPremium} />
      </div>

      {!result && !aiGenerate.isPending && (
        <>
          <div className="space-y-1.5">
            <label htmlFor={`${ids}-cv`} className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              CV to draw on
            </label>
            <div className="relative">
              <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" aria-hidden="true" />
              <select
                id={`${ids}-cv`}
                value={cvChoice}
                onChange={(e) => onCvChoiceChange(e.target.value)}
                aria-describedby={`${ids}-cv-hint`}
                className="w-full appearance-none rounded-lg border border-accent-muted dark:border-gray-700 bg-white dark:bg-gray-800 pl-8 pr-8 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-dark focus:border-transparent"
              >
                <option value={ACTIVE_CV}>My active CV (recommended)</option>
                {cvVersions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
                <option value={NO_CV}>Don't use my CV</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" aria-hidden="true" />
            </div>
            <p id={`${ids}-cv-hint`} className="text-[11px] text-text-tertiary">
              {cvChoice === NO_CV
                ? "Your CV won't be sent to the AI — it writes from the job details only."
                : "The AI personalises the letter with your CV's experience and skills."}
            </p>
          </div>

          {linkedJob && (
            <p className="text-[11px] text-text-secondary">
              For your tracked job <span className="font-medium">{linkedJob.company} — {linkedJob.role}</span>
              {linkedJob.hasJobDescription && " (its job description is used automatically)"}.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label htmlFor={`${ids}-role`} className="sr-only">
                Target role (optional)
              </label>
              <input
                id={`${ids}-role`}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                maxLength={SHORT_MAX}
                placeholder="Target role (optional)"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor={`${ids}-company`} className="sr-only">
                Company name (optional)
              </label>
              <input
                id={`${ids}-company`}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                maxLength={SHORT_MAX}
                placeholder="Company name (optional)"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor={`${ids}-url`} className="sr-only">
              Company website (optional)
            </label>
            <input
              id={`${ids}-url`}
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              maxLength={URL_MAX}
              inputMode="url"
              placeholder="Company website (optional), e.g. acme.com"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`${ids}-jd`} className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Job description <span className="normal-case font-normal">— paste for best results</span>
            </label>
            <textarea
              id={`${ids}-jd`}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              maxLength={JOB_DESCRIPTION_MAX}
              placeholder="Paste the job spec here…"
              rows={5}
              className={`${inputClass} resize-y`}
            />
          </div>

          <fieldset className="flex items-center gap-2">
            <legend className="sr-only">Tone</legend>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400" aria-hidden="true">
              Tone:
            </span>
            <div className="flex rounded-lg border border-accent-muted overflow-hidden">
              {(["professional", "friendly"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={tone === t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 text-[11px] font-medium capitalize transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${
                    tone === t
                      ? "bg-accent-dark text-white dark:bg-accent dark:text-gray-950"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-accent-muted/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>

          <AiActionGrid
            hasContent={hasBody}
            disabled={aiGenerate.isPending}
            onAction={(selected) => void handleGenerate(selected)}
            size="md"
          />
        </>
      )}

      {aiGenerate.isPending && (
        <div role="status" className="flex flex-col items-center justify-center gap-3 py-8">
          <Loader2 className="h-6 w-6 text-accent-dark dark:text-accent animate-spin" aria-hidden="true" />
          <span className="text-sm font-medium text-accent-dark dark:text-accent">AI is writing your cover letter…</span>
          <span className="text-[11px] text-text-tertiary">This can take up to a minute</span>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 text-[11px] font-medium text-red-700 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 underline"
          >
            Try again
          </button>
        </div>
      )}

      {result && (
        <AiResultPreview
          heading="AI-generated cover letter"
          content={result}
          replacesText={hasBody}
          regenerating={aiGenerate.isPending}
          onApply={() => {
            onApply(result);
            reset();
          }}
          onRegenerate={() => void handleGenerate(action ?? "generate")}
          onDiscard={reset}
        />
      )}
    </section>
  );
}
