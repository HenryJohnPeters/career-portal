/*
 * Job tracker statuses and limits. Mirrors JobStatus / JOB_STATUSES /
 * JOB_LIMITS in libs/shared/types/src/jobs.ts (jobs.constants.spec.ts asserts
 * they match), because the API cannot import libs at runtime.
 */

export const JOB_STATUSES = [
  "wishlist",
  "applied",
  "phone_screen",
  "technical_interview",
  "onsite",
  "tech_test",
  "accepted",
  "rejected",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/** Server-side limits shared with the web (the API rejects anything larger). */
export const JOB_LIMITS = {
  jobDescription: 20_000,
  jobDescriptionMinForAnalysis: 50,
  location: 120,
  salary: 120,
  keySkills: 30,
  keySkillLength: 60,
  jobsPerUser: 2000,
} as const;

/** API-only field and list limits. */
export const JOB_FIELD_LIMITS = {
  company: 200,
  role: 200,
  url: 2000,
  notes: 10_000,
  /** GET /jobs returns at most this many jobs (most recently updated first). */
  listCap: 1000,
} as const;

/** Statuses that count as an interview stage (dashboard "interviewing"). */
export const INTERVIEW_STATUSES: readonly JobStatus[] = [
  "phone_screen",
  "technical_interview",
  "onsite",
  "tech_test",
];

/** Finished applications: no follow-up reminders. */
export const CLOSED_STATUSES: readonly JobStatus[] = ["accepted", "rejected"];

/**
 * Values written by older versions of the tracker. They are only mapped on
 * read and in filters; new writes accept JOB_STATUSES only.
 */
const LEGACY_STATUS_MAP: Readonly<Record<string, JobStatus>> = {
  saved: "wishlist",
  interview: "phone_screen",
  offer: "accepted",
  ghosted: "rejected",
};

const CURRENT_STATUSES: ReadonlySet<string> = new Set(JOB_STATUSES);

/** Current status for a stored value; unknown values read as "applied". */
export function normalizeJobStatus(stored: string | null | undefined): JobStatus {
  if (stored && CURRENT_STATUSES.has(stored)) return stored as JobStatus;
  return (stored && LEGACY_STATUS_MAP[stored]) || "applied";
}

/** Every stored value (current and legacy) meaning one of `statuses`, for `status: { in }` filters. */
export function storedStatusValues(statuses: readonly JobStatus[]): string[] {
  const wanted = new Set<string>(statuses);
  const legacy = Object.entries(LEGACY_STATUS_MAP)
    .filter(([, status]) => wanted.has(status))
    .map(([value]) => value);
  return [...statuses, ...legacy];
}
