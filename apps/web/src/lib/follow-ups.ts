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

/**
 * Calendar date of an "Applied on" value. Dates the user picked, or the app
 * stamped as today's local date, are stored at UTC midnight and read as-is;
 * a full timestamp (stamped by the server at the moment of the move) is shown
 * as the user's local date, so it isn't a day off far from UTC.
 */
export function appliedDateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}(T00:00:00(\.0+)?Z)?$/.test(value)) return toDateKey(value);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? toDateKey(value) : localDateKey(date);
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
