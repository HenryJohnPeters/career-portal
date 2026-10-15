import type {
  DashboardSummary,
  JobBrief,
  OnboardingStep,
  OnboardingStepKey,
  RecentActivityItem,
} from "@careerportal/shared/types";
import { isClosedStatus } from "../../tracker/constants";
import { toDateKey } from "../../tracker/lib/follow-up";

/* ── Action centre ─────────────────────────────────────────────────── */

export interface FollowUpGroups {
  overdue: JobBrief[];
  today: JobBrief[];
  upcoming: JobBrief[];
}

/** Splits follow-ups by the user's local date (the API sends a 7-day window, soonest first). */
export function splitFollowUps(followUps: readonly JobBrief[], today: string): FollowUpGroups {
  const groups: FollowUpGroups = { overdue: [], today: [], upcoming: [] };
  for (const job of followUps) {
    const due = toDateKey(job.followUpDate);
    if (!due || isClosedStatus(job.status)) continue;
    if (due < today) groups.overdue.push(job);
    else if (due === today) groups.today.push(job);
    else groups.upcoming.push(job);
  }
  return groups;
}

/* ── Recent activity ───────────────────────────────────────────────── */

const ACTIVITY_PATHS: Record<RecentActivityItem["type"], (id: string) => string> = {
  cv: (id) => `/app/cv?version=${id}`,
  "cover-letter": (id) => `/app/cover-letters?letter=${id}`,
  job: (id) => `/app/jobs?job=${id}`,
  interview: (id) => `/app/practice?session=${id}`,
  "technical-test": (id) => `/app/technical-tests?test=${id}`,
};

/** Deep link to the item, or null for an activity type this version doesn't know. */
export function activityHref(item: Pick<RecentActivityItem, "type" | "id">): string | null {
  const build = ACTIVITY_PATHS[item.type];
  return build ? build(encodeURIComponent(item.id)) : null;
}

/** "just now", "5m ago", "3h ago", "2d ago", then a short date. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.floor(Math.max(0, now - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/* ── Onboarding ────────────────────────────────────────────────────── */

export interface OnboardingStepMeta {
  title: string;
  description: string;
  href: string;
  cta: string;
}

export const ONBOARDING_STEPS: Readonly<Record<OnboardingStepKey, OnboardingStepMeta>> = {
  cv_created: {
    title: "Create your CV",
    description: "Start from a template or paste the CV you already have.",
    href: "/app/cv?new=1",
    cta: "Create CV",
  },
  cv_complete: {
    title: "Fill in your CV",
    description: "Add at least three sections, such as your profile, experience and skills.",
    href: "/app/cv",
    cta: "Open CV builder",
  },
  job_tracked: {
    title: "Track a job you want",
    description: "Paste the job ad and the details are filled in for you.",
    href: "/app/jobs?new=1",
    cta: "Add a job",
  },
  match_checked: {
    title: "Check your CV against a job",
    description: "Open a tracked job and run a CV match to see missing keywords. Free, no AI used.",
    href: "/app/jobs",
    cta: "Open tracker",
  },
  cover_letter: {
    title: "Write a cover letter",
    description: "Draft one yourself or get help from AI.",
    href: "/app/cover-letters?new=1",
    cta: "Write a letter",
  },
  mock_interview: {
    title: "Practise a mock interview",
    description: "Answer real interview questions and get a scored report.",
    href: "/app/practice",
    cta: "Start practising",
  },
};

export interface OnboardingProgress {
  steps: (OnboardingStep & OnboardingStepMeta)[];
  done: number;
  total: number;
  /** First step still to do. */
  next: OnboardingStepKey | null;
}

/** Known steps (in server order) with their copy; unknown keys are skipped. */
export function onboardingProgress(steps: readonly OnboardingStep[]): OnboardingProgress {
  const known = steps
    .filter((step) => step.key in ONBOARDING_STEPS)
    .map((step) => ({ ...step, ...ONBOARDING_STEPS[step.key] }));
  const done = known.filter((step) => step.done).length;
  return {
    steps: known,
    done,
    total: known.length,
    next: known.find((step) => !step.done)?.key ?? null,
  };
}

/* ── Defaults for partial payloads ─────────────────────────────────── */

const EMPTY_ACTION_CENTRE: DashboardSummary["actionCentre"] = {
  followUps: [],
  staleApplications: [],
  interviewing: [],
};

/** Fills sections an older API might omit, so the page never crashes on a partial summary. */
export function normalizeSummary(summary: DashboardSummary): DashboardSummary {
  return {
    ...summary,
    recentActivity: summary.recentActivity ?? [],
    pipeline: summary.pipeline ?? ({} as DashboardSummary["pipeline"]),
    actionCentre: { ...EMPTY_ACTION_CENTRE, ...summary.actionCentre },
    onboarding: summary.onboarding ?? { dismissed: true, steps: [] },
  };
}
