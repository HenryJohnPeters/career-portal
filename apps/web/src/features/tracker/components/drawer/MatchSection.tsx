import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Target, XCircle } from "lucide-react";
import type { Job, MatchResult } from "@careerportal/shared/types";
import { getErrorMessage, useMatchJob } from "@careerportal/web/data-access";
import { Alert, Button } from "@careerportal/web/ui";
import { ProgressRing } from "../../../shared";
import { matchScoreTone } from "../../constants";
import { formatDateKey, toDateKey } from "../../lib/follow-up";
import { DrawerSection, type DocumentOption } from "./DrawerSection";

const MAX_KEYWORDS = 12;
const MAX_CHECKS = 4;

/** CV used by default: the job's linked CV, else the active CV, else the first one. */
export function defaultCvId(job: Pick<Job, "cvVersionId">, cvOptions: readonly DocumentOption[]): string {
  if (job.cvVersionId && cvOptions.some((o) => o.id === job.cvVersionId)) return job.cvVersionId;
  return (cvOptions.find((o) => o.isActive) ?? cvOptions[0])?.id ?? "";
}

/** Free, deterministic keyword match between a CV version and the job description. */
export function MatchSection({ job, cvOptions }: { job: Job; cvOptions: readonly DocumentOption[] }) {
  const selectId = useId();
  const match = useMatchJob({ silent: true });
  const [cvVersionId, setCvVersionId] = useState(() => defaultCvId(job, cvOptions));
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCv = cvVersionId || defaultCvId(job, cvOptions);
  const canRun = job.hasJobDescription && !!selectedCv;
  const lastChecked = toDateKey(job.matchCheckedAt);

  const run = async () => {
    if (!canRun) return;
    setError(null);
    try {
      const res = await match.mutateAsync({ jobId: job.id, cvVersionId: selectedCv });
      setResult(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "The match check couldn't run. Please try again."));
    }
  };

  const failedChecks = result?.atsChecks.filter((check) => !check.passed).slice(0, MAX_CHECKS) ?? [];
  const missing = [...(result?.missingKeywords ?? [])].sort((a, b) => b.weight - a.weight).slice(0, MAX_KEYWORDS);

  return (
    <DrawerSection
      title="CV match"
      icon={Target}
      aside={
        !result && job.matchScore !== null && job.matchScore !== undefined ? (
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${matchScoreTone(job.matchScore)}`}
            title={lastChecked ? `Checked ${formatDateKey(lastChecked)}` : undefined}
          >
            Last score {job.matchScore}%
          </span>
        ) : undefined
      }
    >
      <p className="text-xs text-text-secondary">
        See which keywords from this job your CV covers. It's a keyword check, not a hiring prediction — free and
        unlimited, no AI used.
      </p>

      {cvOptions.length === 0 ? (
        <p className="mt-3 text-sm text-text-secondary">
          <Link to="/app/cv?new=1" className="font-semibold text-primary-700 dark:text-primary-300 hover:underline">
            Create a CV
          </Link>{" "}
          to check it against this job.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor={selectId} className="label">
              CV to check
            </label>
            <select
              id={selectId}
              value={selectedCv}
              onChange={(e) => {
                setCvVersionId(e.target.value);
                setResult(null);
              }}
              className="input-base py-2"
            >
              {cvOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                  {option.isActive ? " (active)" : ""}
                </option>
              ))}
            </select>
          </div>
          <Button size="md" onClick={() => void run()} loading={match.isPending} disabled={!canRun} className="mb-0.5">
            <Target className="h-4 w-4" aria-hidden="true" />
            Check match
          </Button>
        </div>
      )}

      {!job.hasJobDescription && cvOptions.length > 0 && (
        <p className="mt-2 text-xs text-text-tertiary">Add the job description above to run a match.</p>
      )}

      {error && (
        <Alert variant="error" className="mt-3">
          {error}
        </Alert>
      )}

      {result && (
        <div className="mt-4 space-y-4" aria-live="polite">
          <div className="flex items-center gap-4">
            <ProgressRing percentage={result.score} size={84} strokeWidth={7} label="match" />
            <p className="text-sm text-text-secondary">
              Your CV covers{" "}
              <span className="font-semibold text-text-primary">{result.matchedKeywords.length}</span> of the{" "}
              {result.matchedKeywords.length + result.missingKeywords.length} keywords we found in this job.
            </p>
          </div>

          {missing.length > 0 && (
            <div>
              <p className="label">Missing keywords</p>
              <ul className="flex flex-wrap gap-1.5">
                {missing.map((keyword) => (
                  <li
                    key={keyword.keyword}
                    title={keyword.suggestedSection ? `Try adding it to: ${keyword.suggestedSection}` : undefined}
                    className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-red-200/60 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800/40"
                  >
                    {keyword.keyword}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {failedChecks.length > 0 ? (
            <div>
              <p className="label">ATS checks to fix</p>
              <ul className="space-y-1.5">
                {failedChecks.map((check) => (
                  <li key={check.key} className="flex gap-2 text-xs text-text-secondary">
                    <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-500" aria-hidden="true" />
                    <span>
                      <span className="font-semibold text-text-primary">{check.label}.</span> {check.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Your CV passes the basic ATS checks.
            </p>
          )}

          <Link
            to={`/app/cv?version=${encodeURIComponent(result.cvVersionId)}&tab=match&job=${encodeURIComponent(job.id)}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 dark:text-primary-300 hover:underline"
          >
            Improve this CV in the CV builder
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}
    </DrawerSection>
  );
}
