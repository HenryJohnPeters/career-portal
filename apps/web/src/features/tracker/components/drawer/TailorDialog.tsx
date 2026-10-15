import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Sparkles, Wand2 } from "lucide-react";
import type { Job, TailorApplicationResult, TailorTone } from "@careerportal/shared/types";
import {
  getErrorMessage,
  isUpgradeError,
  requestUpgradeForError,
  useTailorApplication,
} from "@careerportal/web/data-access";
import { Alert, Button, Dialog, SelectField, Spinner } from "@careerportal/web/ui";
import { defaultCvId } from "./MatchSection";
import type { DocumentOption } from "./DrawerSection";

const TONES: readonly { value: TailorTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "enthusiastic", label: "Enthusiastic" },
  { value: "concise", label: "Concise" },
];

interface TailorDialogProps {
  job: Job;
  cvOptions: readonly DocumentOption[];
  onClose: () => void;
}

/**
 * Premium "Tailor for this job" kit: copies a CV, rewrites its profile,
 * experience and skills for the job, optionally writes a matching cover
 * letter, and links both to the application.
 */
export function TailorDialog({ job, cvOptions, onClose }: TailorDialogProps) {
  const tailor = useTailorApplication({ silent: true });
  const [cvVersionId, setCvVersionId] = useState(() => defaultCvId(job, cvOptions));
  const [includeCoverLetter, setIncludeCoverLetter] = useState(true);
  const [tone, setTone] = useState<TailorTone>("professional");
  const [result, setResult] = useState<TailorApplicationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = tailor.isPending;

  const submit = async () => {
    if (!cvVersionId || running) return;
    setError(null);
    try {
      const res = await tailor.mutateAsync({ jobId: job.id, cvVersionId, includeCoverLetter, tone });
      setResult(res.data);
    } catch (err) {
      if (isUpgradeError(err)) {
        onClose();
        requestUpgradeForError(err);
        return;
      }
      setError(getErrorMessage(err, "Tailoring didn't finish. Nothing was saved — please try again."));
    }
  };

  // The request keeps running on the server, so the dialog stays open until it finishes.
  const close = () => {
    if (!running) onClose();
  };

  return (
    <Dialog
      open
      onClose={close}
      size="lg"
      closeOnBackdrop={!running}
      hideCloseButton={running}
      title={result ? "Your tailored application is ready" : `Tailor for ${job.role} at ${job.company}`}
      description={
        result
          ? "Both are saved and linked to this application. Review them before you send anything."
          : "We'll copy your CV and rewrite its profile, experience and skills for this job description."
      }
      icon={
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
        >
          {result ? <CheckCircle2 className="h-5 w-5" /> : <Wand2 className="h-5 w-5" />}
        </div>
      }
      footer={
        result ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={close} disabled={running}>
              Cancel
            </Button>
            <Button type="submit" form="tailor-application-form" loading={running} disabled={!cvVersionId}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Tailor application
            </Button>
          </>
        )
      }
    >
      {result ? (
        <ul className="space-y-2">
          <li>
            <Link
              to={`/app/cv?version=${encodeURIComponent(result.cvVersion.id)}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text-primary hover:border-primary-300 hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
            >
              <span className="truncate">CV: {result.cvVersion.title}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
            </Link>
          </li>
          {result.coverLetter && (
            <li>
              <Link
                to={`/app/cover-letters?letter=${encodeURIComponent(result.coverLetter.id)}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text-primary hover:border-primary-300 hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
              >
                <span className="truncate">Cover letter: {result.coverLetter.title}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
              </Link>
            </li>
          )}
        </ul>
      ) : running ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center" aria-live="polite">
          <Spinner label="Tailoring your application" className="py-2" />
          <p className="text-sm text-text-secondary">
            Tailoring your CV{includeCoverLetter ? " and writing your cover letter" : ""}. This usually takes under a
            minute — please keep this window open.
          </p>
        </div>
      ) : (
        <form
          id="tailor-application-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {error && <Alert variant="error">{error}</Alert>}
          <SelectField
            label="Start from this CV"
            value={cvVersionId}
            onChange={(e) => setCvVersionId(e.target.value)}
            hint="Your original CV is not changed — a new version is created."
          >
            {cvOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
                {option.isActive ? " (active)" : ""}
              </option>
            ))}
          </SelectField>
          <SelectField label="Tone" value={tone} onChange={(e) => setTone(e.target.value as TailorTone)}>
            {TONES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <label className="flex items-start gap-3 rounded-xl border border-border px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCoverLetter}
              onChange={(e) => setIncludeCoverLetter(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
            />
            <span>
              <span className="block text-sm font-semibold text-text-primary">Also write a cover letter</span>
              <span className="block text-xs text-text-secondary">Linked to this application, ready to edit.</span>
            </span>
          </label>
          <p className="text-xs text-text-tertiary">
            Uses {includeCoverLetter ? "2 AI actions" : "1 AI action"} from your fair-use allowance.
          </p>
        </form>
      )}
    </Dialog>
  );
}
