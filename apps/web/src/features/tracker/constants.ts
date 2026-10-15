import {
  Building2,
  Code2,
  Monitor,
  PhoneCall,
  Send,
  Star,
  Trophy,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { JOB_LIMITS, type JobStatus } from "@careerportal/shared/types";

export interface PipelineColumn {
  id: JobStatus;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  headerBg: string;
  dropBg: string;
  /** Solid bar colour for charts (pipeline breakdown). */
  bar: string;
}

export const PIPELINE_COLUMNS: readonly PipelineColumn[] = [
  {
    id: "wishlist",
    label: "Wishlist",
    icon: Star,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    headerBg: "bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800/50",
    dropBg: "bg-purple-50/50 dark:bg-purple-900/10",
    bar: "bg-purple-500",
  },
  {
    id: "applied",
    label: "Applied",
    icon: Send,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    headerBg: "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50",
    dropBg: "bg-blue-50/50 dark:bg-blue-900/10",
    bar: "bg-blue-500",
  },
  {
    id: "phone_screen",
    label: "Phone Screen",
    icon: PhoneCall,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
    headerBg: "bg-cyan-100 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800/50",
    dropBg: "bg-cyan-50/50 dark:bg-cyan-900/10",
    bar: "bg-cyan-500",
  },
  {
    id: "technical_interview",
    label: "Technical Interview",
    icon: Monitor,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    headerBg: "bg-sky-100 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800/50",
    dropBg: "bg-sky-50/50 dark:bg-sky-900/10",
    bar: "bg-sky-500",
  },
  {
    id: "onsite",
    label: "Onsite",
    icon: Building2,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    headerBg: "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800/50",
    dropBg: "bg-indigo-50/50 dark:bg-indigo-900/10",
    bar: "bg-indigo-500",
  },
  {
    id: "tech_test",
    label: "Tech Test",
    icon: Code2,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    headerBg: "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50",
    dropBg: "bg-amber-50/50 dark:bg-amber-900/10",
    bar: "bg-amber-500",
  },
  {
    id: "accepted",
    label: "Accepted",
    icon: Trophy,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    headerBg: "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50",
    dropBg: "bg-emerald-50/50 dark:bg-emerald-900/10",
    bar: "bg-emerald-500",
  },
  {
    id: "rejected",
    label: "Rejected",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    headerBg: "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800/50",
    dropBg: "bg-red-50/50 dark:bg-red-900/10",
    bar: "bg-red-500",
  },
];

const COLUMN_BY_STATUS = new Map<string, PipelineColumn>(PIPELINE_COLUMNS.map((c) => [c.id, c]));

export function getPipelineColumn(status: string): PipelineColumn | undefined {
  return COLUMN_BY_STATUS.get(status);
}

export function statusLabel(status: string): string {
  return COLUMN_BY_STATUS.get(status)?.label ?? status;
}

/** Finished applications: no follow-up reminders. */
export const CLOSED_STATUSES: ReadonlySet<JobStatus> = new Set<JobStatus>(["accepted", "rejected"]);

export function isClosedStatus(status: string): boolean {
  return CLOSED_STATUSES.has(status as JobStatus);
}

/**
 * Field limits the API enforces (jobs.dto.ts). The shared JOB_LIMITS covers
 * the newer fields; company/role/url/notes limits are API-only constants.
 */
export const JOB_FORM_LIMITS = {
  company: 200,
  role: 200,
  url: 2000,
  notes: 10_000,
  location: JOB_LIMITS.location,
  salary: JOB_LIMITS.salary,
  jobDescription: JOB_LIMITS.jobDescription,
  jobDescriptionMinForAnalysis: JOB_LIMITS.jobDescriptionMinForAnalysis,
  keySkills: JOB_LIMITS.keySkills,
  keySkillLength: JOB_LIMITS.keySkillLength,
} as const;

/** GET /jobs returns at most this many jobs (most recently updated first). */
export const JOB_LIST_CAP = 1000;

/** Chip colours for a 0-100 keyword match score. */
export function matchScoreTone(score: number): string {
  if (score >= 70) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (score >= 40) return "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300";
}
