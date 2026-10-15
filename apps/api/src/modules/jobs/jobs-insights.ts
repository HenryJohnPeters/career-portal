import { DAY_MS } from "../../common/plan";
import { normalizeJobStatus, type JobStatus } from "./jobs.constants";

/*
 * Application funnel for GET /jobs/insights. Status is the job's current
 * stage only (there is no history), so each funnel step counts jobs that
 * reached at least that stage:
 *   applied      – anything past the wishlist
 *   responded    – got a reply: phone screen or later (a rejection may have
 *                  come with or without one, so it counts as no response)
 *   interviewing – reached a technical interview, onsite or tech test, or an offer
 *   offers       – accepted
 * Rates are whole percentages of `applied` (null when nothing is applied yet).
 */

export interface InsightsJobRow {
  status: string;
  appliedAt: Date | null;
  createdAt: Date;
  cvVersionId: string | null;
}

export interface JobFunnel {
  total: number;
  applied: number;
  responded: number;
  interviewing: number;
  offers: number;
  rejected: number;
}

export interface CvVersionPerformance {
  cvVersionId: string;
  title: string;
  applications: number;
  responses: number;
  responseRate: number | null;
}

export interface JobInsights {
  funnel: JobFunnel;
  rates: { response: number | null; interview: number | null; offer: number | null };
  /** Applications per UTC week (Monday start), last 12 weeks, oldest first. */
  weekly: { weekStart: string; count: number }[];
  byCvVersion: CvVersionPerformance[] | null;
  locked: boolean;
}

export const INSIGHT_WEEKS = 12;
/** CV versions listed in the premium breakdown. */
const MAX_CV_ROWS = 20;

const RESPONDED: ReadonlySet<JobStatus> = new Set([
  "phone_screen",
  "technical_interview",
  "onsite",
  "tech_test",
  "accepted",
]);
const INTERVIEWED: ReadonlySet<JobStatus> = new Set([
  "technical_interview",
  "onsite",
  "tech_test",
  "accepted",
]);

/** Whole percentage, or null when there is nothing to divide by. */
export function percent(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((100 * part) / whole) : null;
}

/** Monday 00:00 UTC of the week containing `date`. */
export function startOfUtcWeek(date: Date): Date {
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return new Date(midnight - daysSinceMonday * DAY_MS);
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

function weeklyApplications(
  appliedDates: readonly Date[],
  now: Date,
): JobInsights["weekly"] {
  const thisWeek = startOfUtcWeek(now).getTime();
  const firstWeek = thisWeek - (INSIGHT_WEEKS - 1) * 7 * DAY_MS;
  const counts = new Array<number>(INSIGHT_WEEKS).fill(0);
  for (const date of appliedDates) {
    const index = Math.floor((startOfUtcWeek(date).getTime() - firstWeek) / (7 * DAY_MS));
    if (index >= 0 && index < INSIGHT_WEEKS) counts[index]++;
  }
  return counts.map((count, index) => ({
    weekStart: isoDate(new Date(firstWeek + index * 7 * DAY_MS)),
    count,
  }));
}

function performanceByCv(
  applied: readonly { status: JobStatus; cvVersionId: string | null }[],
  cvTitles: ReadonlyMap<string, string>,
): CvVersionPerformance[] {
  const byCv = new Map<string, { applications: number; responses: number }>();
  for (const job of applied) {
    if (!job.cvVersionId) continue;
    const entry = byCv.get(job.cvVersionId) ?? { applications: 0, responses: 0 };
    entry.applications++;
    if (RESPONDED.has(job.status)) entry.responses++;
    byCv.set(job.cvVersionId, entry);
  }
  return [...byCv.entries()]
    .map(([cvVersionId, { applications, responses }]) => ({
      cvVersionId,
      title: cvTitles.get(cvVersionId) ?? "Untitled CV",
      applications,
      responses,
      responseRate: percent(responses, applications),
    }))
    .sort((a, b) => b.applications - a.applications || a.title.localeCompare(b.title))
    .slice(0, MAX_CV_ROWS);
}

export function buildJobInsights(
  rows: readonly InsightsJobRow[],
  options: { now: Date; includeByCv: boolean; cvTitles: ReadonlyMap<string, string> },
): JobInsights {
  const jobs = rows.map((row) => ({ ...row, status: normalizeJobStatus(row.status) }));
  const applied = jobs.filter((job) => job.status !== "wishlist");

  const funnel: JobFunnel = {
    total: jobs.length,
    applied: applied.length,
    responded: applied.filter((job) => RESPONDED.has(job.status)).length,
    interviewing: applied.filter((job) => INTERVIEWED.has(job.status)).length,
    offers: applied.filter((job) => job.status === "accepted").length,
    rejected: applied.filter((job) => job.status === "rejected").length,
  };

  return {
    funnel,
    rates: {
      response: percent(funnel.responded, funnel.applied),
      interview: percent(funnel.interviewing, funnel.applied),
      offer: percent(funnel.offers, funnel.applied),
    },
    weekly: weeklyApplications(
      applied.map((job) => job.appliedAt ?? job.createdAt),
      options.now,
    ),
    byCvVersion: options.includeByCv ? performanceByCv(applied, options.cvTitles) : null,
    locked: !options.includeByCv,
  };
}
