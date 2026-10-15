import { ExternalLink, PencilLine } from "lucide-react";
import { Alert, SelectField, TextField, TextareaField } from "@careerportal/web/ui";
import { JOB_FORM_LIMITS, PIPELINE_COLUMNS } from "../../constants";
import { isValidWebUrl, normalizeWebUrl, safeExternalUrl } from "../../lib/job-form";
import type { JobDetailsFormState } from "../../hooks/useJobDetailsForm";
import { DrawerSection, type DocumentOption } from "./DrawerSection";

interface JobDetailsFormProps {
  formId: string;
  form: JobDetailsFormState;
  cvOptions: readonly DocumentOption[];
  letterOptions: readonly DocumentOption[];
  /** False while the CV / letter lists are still loading (no "unavailable" option yet). */
  documentsLoaded: boolean;
}

/** Options for a linked document, plus a placeholder when the linked one no longer exists. */
function DocumentOptions({
  options,
  value,
  documentsLoaded,
  missingLabel,
}: {
  options: readonly DocumentOption[];
  value: string;
  documentsLoaded: boolean;
  missingLabel: string;
}) {
  const missing = documentsLoaded && value !== "" && !options.some((o) => o.id === value);
  return (
    <>
      <option value="">None</option>
      {missing && <option value={value}>{missingLabel}</option>}
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.title}
          {option.isActive ? " (active)" : ""}
        </option>
      ))}
    </>
  );
}

export function JobDetailsForm({ formId, form, cvOptions, letterOptions, documentsLoaded }: JobDetailsFormProps) {
  const { values, errors, setField, save, saving, saveError, dismissSaveError } = form;
  const normalizedUrl = normalizeWebUrl(values.url);
  const openUrl = normalizedUrl && isValidWebUrl(normalizedUrl) ? safeExternalUrl(normalizedUrl) : null;

  return (
    <DrawerSection title="Details" icon={PencilLine}>
      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <fieldset disabled={saving} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <legend className="sr-only">Application details</legend>
          {saveError && (
            <div className="sm:col-span-2">
              <Alert
                variant="error"
                title="Not saved"
                action={
                  <button type="button" onClick={dismissSaveError} className="text-xs font-semibold underline">
                    Dismiss
                  </button>
                }
              >
                {saveError}
              </Alert>
            </div>
          )}
          <TextField
            label="Company"
            required
            value={values.company}
            onChange={(e) => setField("company", e.target.value)}
            maxLength={JOB_FORM_LIMITS.company}
            error={errors.company}
            autoComplete="organization"
          />
          <TextField
            label="Job title"
            required
            value={values.role}
            onChange={(e) => setField("role", e.target.value)}
            maxLength={JOB_FORM_LIMITS.role}
            error={errors.role}
            autoComplete="organization-title"
          />
          <SelectField
            label="Stage"
            value={values.status}
            onChange={(e) => setField("status", e.target.value as typeof values.status)}
          >
            {PIPELINE_COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>
                {col.label}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Applied on"
            type="date"
            value={values.appliedAt}
            onChange={(e) => setField("appliedAt", e.target.value)}
            error={errors.appliedAt}
            hint={values.status !== "wishlist" && !values.appliedAt ? "Set automatically when you apply." : undefined}
          />
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
            hint={
              openUrl ? (
                <a
                  href={openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary-700 dark:text-primary-300 hover:underline"
                >
                  Open job posting <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : undefined
            }
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
            <DocumentOptions
              options={cvOptions}
              value={values.cvVersionId}
              documentsLoaded={documentsLoaded}
              missingLabel="Deleted CV"
            />
          </SelectField>
          <SelectField
            label="Cover letter"
            value={values.coverLetterId}
            onChange={(e) => setField("coverLetterId", e.target.value)}
          >
            <DocumentOptions
              options={letterOptions}
              value={values.coverLetterId}
              documentsLoaded={documentsLoaded}
              missingLabel="Deleted letter"
            />
          </SelectField>
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
            rows={5}
            placeholder="Contacts, interview feedback, next steps…"
            value={values.notes}
            onChange={(e) => setField("notes", e.target.value)}
            maxLength={JOB_FORM_LIMITS.notes}
            error={errors.notes}
          />
        </fieldset>
      </form>
    </DrawerSection>
  );
}
