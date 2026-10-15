// === Dashboard (PLAN §2.8) ===
import type { JobBrief, JobStatus } from "./jobs";

export type RecentActivityType =
  | "cv"
  | "cover-letter"
  | "job"
  | "interview"
  | "technical-test";

export interface RecentActivityItem {
  type: RecentActivityType;
  id: string;
  title: string;
  updatedAt: string;
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

export interface ActionCentre {
  /** Active jobs with a follow-up date up to 7 days ahead, soonest first. Split overdue/upcoming by local date. */
  followUps: JobBrief[];
  /** Applied 14+ days ago with no follow-up date. */
  staleApplications: JobBrief[];
  /** Jobs at an interview stage. */
  interviewing: JobBrief[];
}

/** GET /dashboard/summary */
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
  actionCentre: ActionCentre;
  onboarding: {
    dismissed: boolean;
    steps: OnboardingStep[];
  };
}
