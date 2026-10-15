import { useEffect, useId, useMemo, useState } from "react";
import { CheckCircle2, Info, Loader2, Pencil, Search, XCircle } from "lucide-react";
import type { CvSection, MatchResult } from "@careerportal/shared/types";
import {
  getErrorMessage,
  useJob,
  useJobs,
  useMatchJob,
  useMatchText,
} from "@careerportal/web/data-access";
import { Button } from "@careerportal/web/ui";
import { ProgressRing } from "../../shared";
import { showToast } from "../../../lib/toast";

const JOB_DESCRIPTION_MIN = 50;
const JOB_DESCRIPTION_MAX = 20_000;

function scoreLabel(score: number): string {
  if (score >= 75) return "Strong keyword match";
  if (score >= 50) return "Good keyword match";
  if (score >= 30) return "Partial keyword match";
  return "Low keyword match";
}

/** The CV section a "suggested section" (a title or type) refers to. */
function findSection(sections: CvSection[], suggested: string): CvSection | undefined {
  const target = suggested.trim().toLowerCase();
  return (
    sections.find((s) => s.sectionType.toLowerCase() === target) ??
    sections.find((s) => s.title.trim().toLowerCase() === target) ??
    sections.find((s) => s.title.toLowerCase().includes(target))
  );
}

interface MatchPanelProps {
  versionId: string;
  sections: CvSection[];
  /** Save pending edits first so the server scores the latest text. */
  prepare: () => Promise<boolean>;
  onEditSection: (sectionId: string) => void;
}

/**
 * Deterministic CV ↔ job keyword match (no AI, free and unlimited): paste a job
 * description or pick a tracked job, then see matched and missing keywords and
 * ATS checks.
 */
export function MatchPanel({ versionId, sections, prepare, onEditSection }: MatchPanelProps) {
  const ids = useId();
  const { data: jobsData } = useJobs();
  const trackedJobs = useMemo(
    () => (jobsData?.data ?? []).filter((job) => job.hasJobDescription),
    [jobsData],
  );
  const [jobId, setJobId] = useState("");
  const {
    data: jobData,
    isFetching: jobLoading,
    isError: jobFailed,
    error: jobError,
    refetch: refetchJob,
  } = useJob(jobId || null);
  const jobDescriptionFromJob = jobId ? jobData?.data.jobDescription ?? null : null;

  const [text, setText] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [preparing, setPreparing] = useState(false);
  const matchText = useMatchText();
  const matchJob = useMatchJob();

  // Picking a tracked job fills in its description (still editable).
  useEffect(() => {
    if (jobDescriptionFromJob) setText(jobDescriptionFromJob);
  }, [jobDescriptionFromJob]);

  const running = preparing || matchText.isPending || matchJob.isPending;
  const trimmed = text.trim();
  const tooShort = trimmed.length < JOB_DESCRIPTION_MIN;
  // Unchanged text of a tracked job: score via the job, so the tracker shows it too.
  const usesTrackedJob = !!jobId && !!jobDescriptionFromJob && trimmed === jobDescriptionFromJob.trim();

  const run = async () => {
    if (tooShort || running) return;
    setPreparing(true);
    try {
      if (!(await prepare())) {
        showToast("warning", "Some edits aren't saved yet, so this checks your last saved CV.");
      }
    } finally {
      setPreparing(false);
    }
    try {
      const res = usesTrackedJob
        ? await matchJob.mutateAsync({ jobId, cvVersionId: versionId })
        : await matchText.mutateAsync({ cvVersionId: versionId, jobDescription: trimmed });
      setResult(res.data);
    } catch {
      // Toasted by the global handler.
    }
  };

  const missingBySection = useMemo(() => {
    const groups = new Map<string, MatchResult["missingKeywords"]>();
    for (const keyword of result?.missingKeywords ?? []) {
      const key = keyword.suggestedSection || "Skills";
      groups.set(key, [...(groups.get(key) ?? []), keyword]);
    }
    return [...groups.entries()];
  }, [result]);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Match this CV to a job</h3>
        <p className="text-xs text-text-secondary">
          See which keywords from a job description your CV covers and which it's missing. Free and
          unlimited — no AI credits used.
        </p>
      </div>

      {trackedJobs.length > 0 && (
        <div className="space-y-1.5">
          <label htmlFor={`${ids}-job`} className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Use a tracked job
          </label>
          <select
            id={`${ids}-job`}
            value={jobId}
            onChange={(e) => {
              setJobId(e.target.value);
              setResult(null);
              if (!e.target.value) setText("");
            }}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="">— Paste a job description instead —</option>
            {trackedJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.company} — {job.role}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor={`${ids}-jd`} className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Job description
        </label>
        <div className="relative">
          <textarea
            id={`${ids}-jd`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={JOB_DESCRIPTION_MAX}
            rows={8}
            disabled={jobLoading}
            placeholder="Paste the full job advert here…"
            aria-describedby={`${ids}-jd-hint`}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y leading-relaxed disabled:opacity-60"
          />
          {jobLoading && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-accent" aria-label="Loading the job description" />
          )}
        </div>
        {jobId && jobFailed && !jobLoading && (
          <p role="alert" className="text-[11px] text-red-600 dark:text-red-400">
            {getErrorMessage(jobError, "This job's description couldn't be loaded.")}{" "}
            <button type="button" onClick={() => void refetchJob()} className="font-semibold underline">
              Try again
            </button>
          </p>
        )}
        <p id={`${ids}-jd-hint`} className="text-[11px] text-text-tertiary tabular-nums">
          {trimmed.length > 0 && tooShort
            ? `Paste at least ${JOB_DESCRIPTION_MIN} characters for a useful result.`
            : `${text.length.toLocaleString("en-GB")}/${JOB_DESCRIPTION_MAX.toLocaleString("en-GB")} characters`}
        </p>
      </div>

      <Button onClick={() => void run()} loading={running} disabled={tooShort}>
        {!running && <Search className="h-4 w-4" aria-hidden="true" />}
        {result ? "Check again" : "Check match"}
      </Button>

      {result && (
        <div className="space-y-5" aria-live="polite">
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4">
            <div className="shrink-0" role="img" aria-label={`Keyword match ${result.score} out of 100`}>
              <ProgressRing percentage={result.score} size={88} strokeWidth={7} label="match" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-text-primary">{scoreLabel(result.score)}</p>
              <p className="text-xs text-text-secondary">
                {result.matchedKeywords.length} of{" "}
                {result.matchedKeywords.length + result.missingKeywords.length} important keywords found.
                {usesTrackedJob && " Saved to the job in your tracker."}
              </p>
              <p className="flex items-start gap-1 text-[11px] text-text-tertiary">
                <Info className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
                A keyword check, not a prediction of hiring decisions. Only add skills you really have.
              </p>
            </div>
          </div>

          {missingBySection.length > 0 && (
            <section aria-labelledby={`${ids}-missing`} className="space-y-2">
              <h4 id={`${ids}-missing`} className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Missing keywords
              </h4>
              <ul className="space-y-2">
                {missingBySection.map(([sectionName, keywords]) => {
                  const section = findSection(sections, sectionName);
                  return (
                    <li key={sectionName} className="rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-900/10 p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-amber-900 dark:text-amber-200">
                          Consider adding to {section?.title ?? sectionName}
                        </span>
                        {section && (
                          <button
                            type="button"
                            onClick={() => onEditSection(section.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 dark:text-primary-300 hover:underline"
                          >
                            <Pencil className="h-3 w-3" aria-hidden="true" />
                            Edit section
                          </button>
                        )}
                      </div>
                      <ul className="flex flex-wrap gap-1.5" aria-label={`Missing keywords for ${sectionName}`}>
                        {keywords.map((k) => (
                          <li
                            key={k.keyword}
                            className="rounded-full bg-white dark:bg-gray-800 border border-amber-300/70 dark:border-amber-700/60 px-2 py-0.5 text-[11px] text-amber-900 dark:text-amber-200"
                          >
                            {k.keyword}
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {result.matchedKeywords.length > 0 && (
            <section aria-labelledby={`${ids}-matched`} className="space-y-2">
              <h4 id={`${ids}-matched`} className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Matched keywords
              </h4>
              <ul className="flex flex-wrap gap-1.5">
                {result.matchedKeywords.map((k) => (
                  <li
                    key={k.keyword}
                    title={k.foundIn.length ? `Found in: ${k.foundIn.join(", ")}` : undefined}
                    className="rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-[11px] text-emerald-800 dark:text-emerald-300"
                  >
                    {k.keyword}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.atsChecks.length > 0 && (
            <section aria-labelledby={`${ids}-ats`} className="space-y-2">
              <h4 id={`${ids}-ats`} className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                ATS checks
              </h4>
              <ul className="divide-y divide-gray-100 dark:divide-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                {result.atsChecks.map((check) => (
                  <li key={check.key} className="flex items-start gap-2.5 px-3 py-2.5">
                    {check.passed ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" aria-label="Passed" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" aria-label="Needs attention" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary">{check.label}</p>
                      {check.detail && <p className="text-[11px] text-text-secondary mt-0.5">{check.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
