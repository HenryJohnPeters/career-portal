import { DAY_MS } from "../../common/plan";
import { JOB_STATUSES, normalizeJobStatus, type JobStatus } from "../jobs/jobs.constants";
import type { JobBrief } from "../jobs/jobs.queries";

/*
 * Pure helpers for GET /dashboard/summary. Shapes mirror
 * libs/shared/types/src/dashboard.ts.
 */

export type RecentActivityType = "cv" | "cover-letter" | "job" | "interview" | "technical-test";

export interface RecentActivityItem {
  type: RecentActivityType;
  id: string;
  title: string;
  updatedAt: Date;
}

export type OnboardingStepKey =
  | "cv_created"
  | "cv_complete"
  | "job_tracked"
  | "match_checked"
  | "cover_letter"
  | "mock_interview";

export interface OnboardingStep {
  key: OnboardingStepKey;
  done: boolean;
}

export interface DashboardSummary {
  counts: {
    cvVersions: number;
    coverLetters: number;
    jobs: number;
    interviewSessions: number;
    technicalTests: number;
  };
  recentActivity: RecentActivityItem[];
  pipeline: Record<JobStatus, number>;
  actionCentre: {
    followUps: JobBrief[];
    staleApplications: JobBrief[];
    interviewing: JobBrief[];
  };
  onboarding: { dismissed: boolean; steps: OnboardingStep[] };
}

export const DASHBOARD_LIMITS = {
  /** Items per type considered for recent activity, and the merged total. */
  recentPerType: 5,
  recentTotal: 8,
  followUps: 20,
  staleApplications: 10,
  interviewing: 10,
  /** Follow-ups due within this many days (plus all overdue ones). */
  followUpHorizonDays: 7,
  /** "Applied" jobs older than this with no follow-up date are stale. */
  staleAfterDays: 14,
} as const;

/** `onboarding.cv_complete`: a version with this many sections of at least `minChars`. */
export const CV_COMPLETE_RULE = { sections: 3, minChars: 50 } as const;

export function followUpHorizon(now: Date): Date {
  return new Date(now.getTime() + DASHBOARD_LIMITS.followUpHorizonDays * DAY_MS);
}

export function staleCutoff(now: Date): Date {
  return new Date(now.getTime() - DASHBOARD_LIMITS.staleAfterDays * DAY_MS);
}

/** Job counts per current status (legacy stored values folded in), every status present. */
export function buildPipeline(
  groups: readonly { status: string; count: number }[],
): Record<JobStatus, number> {
  const pipeline = Object.fromEntries(JOB_STATUSES.map((status) => [status, 0])) as Record<
    JobStatus,
    number
  >;
  for (const { status, count } of groups) {
    pipeline[normalizeJobStatus(status)] += count;
  }
  return pipeline;
}

/** Newest first across all types, at most `limit` items. */
export function mergeRecentActivity(
  lists: readonly (readonly RecentActivityItem[])[],
  limit: number = DASHBOARD_LIMITS.recentTotal,
): RecentActivityItem[] {
  return lists
    .flat()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}

const capitalise = (text: string) => (text ? text[0].toUpperCase() + text.slice(1) : text);

/** "Frontend system design interview". */
export function interviewTitle(session: { track: string; interviewType: string }): string {
  const type = session.interviewType.replace(/[-_]+/g, " ").trim();
  return [capitalise(session.track.trim()), type, "interview"].filter(Boolean).join(" ");
}

export function jobTitle(job: { company: string; role: string }): string {
  return `${job.company} — ${job.role}`;
}

export function buildOnboardingSteps(facts: {
  cvVersions: number;
  cvComplete: boolean;
  jobs: number;
  matchChecked: boolean;
  coverLetterWritten: boolean;
  interviewSessions: number;
}): OnboardingStep[] {
  return [
    { key: "cv_created", done: facts.cvVersions > 0 },
    { key: "cv_complete", done: facts.cvComplete },
    { key: "job_tracked", done: facts.jobs > 0 },
    { key: "match_checked", done: facts.matchChecked },
    { key: "cover_letter", done: facts.coverLetterWritten },
    { key: "mock_interview", done: facts.interviewSessions > 0 },
  ];
}
