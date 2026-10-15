import { useId, useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Sparkles } from "lucide-react";
import type { Job, JobDescriptionAnalysis } from "@careerportal/shared/types";
import {
  getErrorMessage,
  requestUpgrade,
  requestUpgradeForError,
  useAnalyzeJobDescription,
  useCreateJob,
  usePlanUsage,
} from "@careerportal/web/data-access";
import {
  Alert,
  Button,
  ConfirmDialog,
  Dialog,
  SelectField,
  TextField,
  TextareaField,
} from "@careerportal/web/ui";
import { JOB_FORM_LIMITS, PIPELINE_COLUMNS } from "../constants";
import { addDaysToDateKey, localDateKey } from "../lib/follow-up";
import {
  EMPTY_JOB_FORM,
  buildCreateRequest,
  hasErrors,
  validateJobForm,
  type JobFormErrors,
  type JobFormValues,
} from "../lib/job-form";
import type { DocumentOption } from "./drawer/DrawerSection";

type Step = "describe" | "details";

const FOLLOW_UP_PICKS = [
  { days: 3, label: "+3 days" },
  { days: 7, label: "+1 week" },
  { days: 14, label: "+2 weeks" },
] as const;

interface AddJobModalProps {
  onClose: () => void;
  onCreated: (job: Job) => void;
  cvOptions: readonly DocumentOption[];
  letterOptions: readonly DocumentOption[];
}

/** Fills only empty fields, so nothing the user typed is overwritten. */
function applyAnalysis(values: JobFormValues, analysis: JobDescriptionAnalysis): JobFormValues {
  const fill = (current: string, value: string | null, max: number) =>
    current.trim() || !value ? current : value.trim().slice(0, max);
  return {
    ...values,
    company: fill(values.company, analysis.company, JOB_FORM_LIMITS.company),
    role: fill(values.role, analysis.role, JOB_FORM_LIMITS.role),
    location: fill(values.location, analysis.location, JOB_FORM_LIMITS.location),
    salary: fill(values.salary, analysis.salary, JOB_FORM_LIMITS.salary),
    keySkills:
      values.keySkills.trim() || analysis.keySkills.length === 0
        ? values.keySkills
        : analysis.keySkills
            .slice(0, JOB_FORM_LIMITS.keySkills)
            .map((skill) => skill.slice(0, JOB_FORM_LIMITS.keySkillLength))
            .join(", "),
  };
}

/**
 * Add an application in two steps: (1) optionally paste the job description
 * and auto-fill the details with AI, (2) check the details and save. A failed
 * save keeps everything that was typed and shows the server's reason.
 */
export function AddJobModal({ onClose, onCreated, cvOptions, letterOptions }: AddJobModalProps) {
  const formId = useId();
  const create = useCreateJob({ silent: true });
  const analyze = useAnalyzeJobDescription({ silent: true });
  const usage = usePlanUsage().data?.data;

  // Fixed at open: later list changes must not reset the form.
  const [initialValues] = useState<JobFormValues>(() => ({
    ...EMPTY_JOB_FORM,
    cvVersionId: cvOptions.find((o) => o.isActive)?.id ?? "",
  }));
  const [step, setStep] = useState<Step>("describe");
  const [values, setValues] = useState<JobFormValues>(initialValues);
  const [errors, setErrors] = useState<JobFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const description = values.jobDescription.trim();
  const canAnalyze = description.length >= JOB_FORM_LIMITS.jobDescriptionMinForAnalysis;
  const aiMeter = usage?.meters.aiActions;
  const aiExhausted = !!usage && !usage.isPremium && !!aiMeter && aiMeter.limit !== null && aiMeter.used >= aiMeter.limit;
  const busy = create.isPending || analyze.isPending;
  const dirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  const today = localDateKey();

  const setField = <K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const requestClose = () => {
    if (busy) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  const runAnalysis = async () => {
    if (!canAnalyze || busy) return;
    if (aiExhausted && aiMeter) {
      requestUpgrade({
        reason: "quota_exceeded",
        quota: "aiActions",
        limit: aiMeter.limit ?? undefined,
        used: aiMeter.used,
        resetsAt: aiMeter.resetsAt,
      });
      return;
    }
    setAnalyzeError(null);
    try {
      const res = await analyze.mutateAsync({ jobDescription: description });
      setValues((current) => applyAnalysis(current, res.data));
      setAutoFilled(true);
      setStep("details");
    } catch (err) {
      if (!requestUpgradeForError(err)) {
        setAnalyzeError(
          getErrorMessage(err, "Auto-fill didn't work this time. You can still fill in the details yourself."),
        );
      }
    }
  };

  const submit = async () => {
    // "Applied on" is hidden for wishlist jobs: drop a date picked before switching back.
    // Otherwise an empty date means today, as the user's calendar has it.
    const toSave =
      values.status === "wishlist"
        ? { ...values, appliedAt: "" }
        : values.appliedAt.trim()
          ? values
          : { ...values, appliedAt: localDateKey() };
    const nextErrors = validateJobForm(toSave);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    setSubmitError(null);
    try {
      const res = await create.mutateAsync(buildCreateRequest(toSave));
      onCreated(res.data);
    } catch (err) {
      if (!requestUpgradeForError(err)) {
        setSubmitError(getErrorMessage(err, "The application couldn't be added. Please try again."));
      }
    }
  };

  const costNote = !usage
    ? "Uses 1 AI action."
    : usage.isPremium
      ? "Uses 1 AI action from your fair-use allowance."
      : aiMeter && aiMeter.limit !== null
        ? `Uses 1 AI action — ${Math.max(0, aiMeter.limit - aiMeter.used)} of ${aiMeter.limit} left this month.`
        : "Uses 1 AI action.";

  return (
    <>
      <Dialog
        open
        onClose={requestClose}
        size="lg"
        closeOnBackdrop={!busy}
        title="Add an application"
        description={
          step === "describe"
            ? "Step 1 of 2 · Paste the job description (optional)."
            : "Step 2 of 2 · Check the details."
        }
        icon={
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
          >
            <Plus className="h-5 w-5" />
          </div>
        }
        footer={
          step === "describe" ? (
            <>
              <Button variant="ghost" onClick={requestClose} disabled={busy}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={() => setStep("details")} disabled={busy}>
                {description ? "Next: details" : "Skip — enter details"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep("describe")} disabled={busy}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Button>
              <Button type="submit" form={formId} loading={create.isPending}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add application
              </Button>
            </>
          )
        }
      >
        {step === "describe" ? (
          <div className="space-y-4">
            <TextareaField
              autoFocus
              label="Job description"
              rows={9}
              value={values.jobDescription}
              maxLength={JOB_FORM_LIMITS.jobDescription}
              onChange={(e) => setField("jobDescription", e.target.value)}
              placeholder="Paste the job ad here: responsibilities, requirements, salary, location…"
              hint="Saved with the application. It powers the free CV match and the Tailor kit."
            />
            {analyzeError && <Alert variant="error">{analyzeError}</Alert>}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary-200/70 bg-primary-50/60 px-4 py-3 dark:border-primary-800/50 dark:bg-primary-900/20">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">Auto-fill with AI</p>
                <p className="text-xs text-text-secondary">
                  {canAnalyze
                    ? `Fills in the company, role, location, salary and key skills. ${costNote}`
                    : `Paste at least ${JOB_FORM_LIMITS.jobDescriptionMinForAnalysis} characters to auto-fill. ${costNote}`}
                </p>
              </div>
              <Button onClick={() => void runAnalysis()} loading={analyze.isPending} disabled={!canAnalyze || create.isPending}>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {analyze.isPending ? "Reading the ad…" : "Auto-fill"}
              </Button>
            </div>
          </div>
        ) : (
          <form
            id={formId}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <fieldset disabled={create.isPending} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <legend className="sr-only">Application details</legend>
              {autoFilled && (
                <div className="sm:col-span-2">
                  <Alert variant="info">Filled in from the job description — check the details before saving.</Alert>
                </div>
              )}
              {submitError && (
                <div className="sm:col-span-2">
                  <Alert variant="error" title="Not added yet">
                    {submitError}
                  </Alert>
                </div>
              )}
              <TextField
                label="Company"
                required
                autoFocus
                value={values.company}
                onChange={(e) => setField("company", e.target.value)}
                maxLength={JOB_FORM_LIMITS.company}
                error={errors.company}
                placeholder="e.g. Acme Corp"
              />
              <TextField
                label="Job title"
                required
                value={values.role}
                onChange={(e) => setField("role", e.target.value)}
                maxLength={JOB_FORM_LIMITS.role}
                error={errors.role}
                placeholder="e.g. Frontend Developer"
              />
              <SelectField
                containerClassName={values.status === "wishlist" ? "sm:col-span-2" : ""}
                label="Stage"
                value={values.status}
                onChange={(e) => setField("status", e.target.value as JobFormValues["status"])}
              >
                {PIPELINE_COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.label}
                  </option>
                ))}
              </SelectField>
              {values.status !== "wishlist" && (
                <TextField
                  label="Applied on"
                  type="date"
                  max={today}
                  value={values.appliedAt}
                  onChange={(e) => setField("appliedAt", e.target.value)}
                  error={errors.appliedAt}
                  hint="Leave empty for today."
                />
              )}
              <TextField
                containerClassName="sm:col-span-2"
                label="Job link"
                type="url"
                inputMode="url"
                placeholder="https://company.com/jobs/123"
                value={values.url}
                onChange={(e) => setField("url", e.target.value)}
                maxLength={JOB_FORM_LIMITS.url}
                error={errors.url}
              />
              <TextField
                label="Location"
                placeholder="e.g. London (hybrid)"
                value={values.location}
                onChange={(e) => setField("location", e.target.value)}
                maxLength={JOB_FORM_LIMITS.location}
                error={errors.location}
              />
              <TextField
                label="Salary"
                placeholder="e.g. £55k–£65k"
                value={values.salary}
                onChange={(e) => setField("salary", e.target.value)}
                maxLength={JOB_FORM_LIMITS.salary}
                error={errors.salary}
              />
              <SelectField
                label="CV version"
                value={values.cvVersionId}
                onChange={(e) => setField("cvVersionId", e.target.value)}
              >
                <option value="">None</option>
                {cvOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title}
                    {option.isActive ? " (active)" : ""}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Cover letter"
                value={values.coverLetterId}
                onChange={(e) => setField("coverLetterId", e.target.value)}
              >
                <option value="">None</option>
                {letterOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title}
                  </option>
                ))}
              </SelectField>
              <div className="sm:col-span-2">
                <TextField
                  label="Follow-up reminder"
                  type="date"
                  min={today}
                  value={values.followUpDate}
                  onChange={(e) => setField("followUpDate", e.target.value)}
                  error={errors.followUpDate}
                />
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Quick follow-up dates">
                  {FOLLOW_UP_PICKS.map((pick) => {
                    const date = addDaysToDateKey(today, pick.days);
                    return (
                      <button
                        key={pick.days}
                        type="button"
                        aria-pressed={values.followUpDate === date}
                        onClick={() => setField("followUpDate", values.followUpDate === date ? "" : date)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                          values.followUpDate === date
                            ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                            : "border-border text-text-secondary hover:border-primary-300"
                        }`}
                      >
                        {pick.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <TextField
                containerClassName="sm:col-span-2"
                label="Key skills"
                placeholder="e.g. React, TypeScript, AWS"
                value={values.keySkills}
                onChange={(e) => setField("keySkills", e.target.value)}
                error={errors.keySkills}
                hint="Separate skills with commas."
              />
              <TextareaField
                containerClassName="sm:col-span-2"
                label="Notes"
                rows={3}
                value={values.notes}
                onChange={(e) => setField("notes", e.target.value)}
                maxLength={JOB_FORM_LIMITS.notes}
                error={errors.notes}
                placeholder="Referral, recruiter name, anything worth remembering…"
              />
            </fieldset>
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard this application?"
        description="What you've entered so far won't be saved."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={onClose}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}
