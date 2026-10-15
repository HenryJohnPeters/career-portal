import type { JobBrief, JobStatus } from "@careerportal/shared/types";

const INACTIVE_STATUSES: ReadonlySet<JobStatus> = new Set<JobStatus>([
  "accepted",
  "rejected",
]);

/**
 * Calendar date ("YYYY-MM-DD") of a follow-up value. Follow-ups are picked as
 * dates and stored at UTC midnight, so the date part is the chosen day; it is
 * never shifted through the local time zone.
 */
export function toDateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

/** Today's date ("YYYY-MM-DD") in the user's local time zone. */
export function localDateKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Follow-ups due before today (local date) on jobs that are still active. */
export function countOverdueFollowUps(
  jobs: readonly Pick<JobBrief, "status" | "followUpDate">[] | null | undefined,
  now: Date = new Date(),
): number {
  if (!jobs) return 0;
  const today = localDateKey(now);
  let count = 0;
  for (const job of jobs) {
    if (INACTIVE_STATUSES.has(job.status)) continue;
    const due = toDateKey(job.followUpDate);
    if (due !== null && due < today) count += 1;
  }
  return count;
}
