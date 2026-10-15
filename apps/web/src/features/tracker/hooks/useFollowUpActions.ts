import { useCallback, useState } from "react";
import type { JobBrief, UpdateJobRequest } from "@careerportal/shared/types";
import { downloadBlob, useUpdateJob } from "@careerportal/web/data-access";
import { useToast } from "../../../lib/toast";
import { addDaysToDateKey, formatDateKey, localDateKey, toDateKey } from "../lib/follow-up";
import { buildFollowUpIcs, followUpIcsFilename } from "../lib/ics";

/** A job or a dashboard job brief. */
export type FollowUpTarget = Pick<JobBrief, "id" | "company" | "role"> & { followUpDate?: string | null };

/** Days ahead for "Done — remind me again". */
export const FOLLOW_UP_SNOOZE_DAYS = 7;

/**
 * One-click follow-up actions shared by the tracker drawer and the dashboard.
 * Each action PATCHes the job immediately; failures are reported by the
 * global mutation error toast, successes with a short confirmation.
 */
export function useFollowUpActions() {
  const { mutateAsync } = useUpdateJob();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = useCallback(
    async (id: string, data: UpdateJobRequest, success: string): Promise<boolean> => {
      setBusyId(id);
      try {
        await mutateAsync({ id, ...data });
        toast("success", success);
        return true;
      } catch {
        return false;
      } finally {
        setBusyId((current) => (current === id ? null : current));
      }
    },
    [mutateAsync, toast],
  );

  /** Set the follow-up `days` from today (local date). */
  const remindIn = useCallback(
    (job: FollowUpTarget, days: number = FOLLOW_UP_SNOOZE_DAYS) => {
      const date = addDaysToDateKey(localDateKey(), days);
      return run(job.id, { followUpDate: date }, `We'll remind you about ${job.company} on ${formatDateKey(date)}.`);
    },
    [run],
  );

  const setFollowUp = useCallback(
    (job: FollowUpTarget, date: string | null) =>
      run(
        job.id,
        { followUpDate: date },
        date ? `Follow-up set for ${formatDateKey(date)}.` : "Follow-up cleared.",
      ),
    [run],
  );

  const markRejected = useCallback(
    (job: FollowUpTarget) => run(job.id, { status: "rejected" }, `${job.company} moved to Rejected.`),
    [run],
  );

  /** Downloads an .ics reminder built in the browser (nothing is uploaded). */
  const downloadCalendar = useCallback((job: FollowUpTarget) => {
    const date = toDateKey(job.followUpDate);
    if (!date) return;
    const ics = buildFollowUpIcs({
      jobId: job.id,
      company: job.company,
      role: job.role,
      date,
      url: `${window.location.origin}/app/jobs?job=${encodeURIComponent(job.id)}`,
    });
    downloadBlob(new Blob([ics], { type: "text/calendar;charset=utf-8" }), followUpIcsFilename(job.company, date));
  }, []);

  return { busyId, remindIn, setFollowUp, markRejected, downloadCalendar };
}
