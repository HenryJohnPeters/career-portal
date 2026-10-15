import { useCallback, useMemo, useState } from "react";
import type { Job } from "@careerportal/shared/types";
import { getErrorMessage, requestUpgradeForError, useUpdateJob } from "@careerportal/web/data-access";
import { useToast } from "../../../lib/toast";
import {
  buildJobPatch,
  hasErrors,
  rebaseFormValues,
  sameFormValues,
  toFormValues,
  validateJobForm,
  type JobFormErrors,
  type JobFormValues,
} from "../lib/job-form";

/**
 * Edit state for a job's details. Only the fields that changed are sent, so
 * clearing a field really clears it (null) and untouched fields — including
 * a link to a CV deleted elsewhere — are never resent. Errors stay in the form.
 */
export function useJobDetailsForm(job: Job) {
  const { mutateAsync, isPending } = useUpdateJob({ silent: true });
  const { toast } = useToast();
  const server = useMemo(() => toFormValues(job), [job]);
  const [initial, setInitial] = useState<JobFormValues>(server);
  const [values, setValues] = useState<JobFormValues>(server);
  const [errors, setErrors] = useState<JobFormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  // The job changed outside this form (the full job loaded, a follow-up quick
  // action, the Tailor kit linking a new CV): show the new values in the
  // fields the user hasn't edited and keep their edits.
  if (!sameFormValues(server, initial)) {
    setInitial(server);
    setValues((current) => rebaseFormValues(current, initial, server));
  }

  const patch = useMemo(() => buildJobPatch(initial, values), [initial, values]);
  const dirty = Object.keys(patch).length > 0;

  const setField = useCallback(<K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  /** Validates and saves; resolves true when the server has the changes. */
  const save = useCallback(async (): Promise<boolean> => {
    // Only what is being sent is checked: an untouched stored value must not block other edits.
    const nextErrors = validateJobForm(values);
    for (const key of Object.keys(nextErrors) as (keyof JobFormValues)[]) {
      if (!(key in patch)) delete nextErrors[key];
    }
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return false;
    if (!dirty) return true;
    setSaveError(null);
    try {
      const res = await mutateAsync({ id: job.id, ...patch });
      const fresh = toFormValues(res.data);
      setInitial(fresh);
      setValues(fresh);
      toast("success", "Changes saved.");
      return true;
    } catch (err) {
      if (!requestUpgradeForError(err)) {
        setSaveError(getErrorMessage(err, "Your changes couldn't be saved. Please try again."));
      }
      return false;
    }
  }, [values, dirty, patch, mutateAsync, job.id, toast]);

  return {
    values,
    errors,
    setField,
    dirty,
    save,
    saving: isPending,
    saveError,
    dismissSaveError: () => setSaveError(null),
  };
}

export type JobDetailsFormState = ReturnType<typeof useJobDetailsForm>;
