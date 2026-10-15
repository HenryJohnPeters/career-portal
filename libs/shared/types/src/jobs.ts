// === Jobs / tracker (PLAN §2.7) ===
import type { CvVersion } from "./cv";
import type { CoverLetter } from "./cover-letters";

export type JobStatus =
  | "wishlist"
  | "applied"
  | "phone_screen"
  | "technical_interview"
  | "onsite"
  | "tech_test"
  | "accepted"
  | "rejected";

export const JOB_STATUSES: readonly JobStatus[] = [
  "wishlist",
  "applied",
  "phone_screen",
  "technical_interview",
  "onsite",
  "tech_test",
  "accepted",
  "rejected",
];

/** Server-side limits (the API rejects anything larger). */
export const JOB_LIMITS = {
  jobDescription: 20_000,
  jobDescriptionMinForAnalysis: 50,
  location: 120,
  salary: 120,
  keySkills: 30,
  keySkillLength: 60,
  jobsPerUser: 2000,
} as const;

export interface Job {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: JobStatus;
  url?: string | null;
  notes?: string | null;
  cvVersionId?: string | null;
  coverLetterId?: string | null;
  followUpDate?: string | null;
  /** Null in GET /jobs (list); use `hasJobDescription` there and GET /jobs/:id for the text. */
  jobDescription: string | null;
  hasJobDescription: boolean;
  location: string | null;
  salary: string | null;
  /** Set by the server when the job first leaves "wishlist". */
  appliedAt: string | null;
  keySkills: string[];
  /** Last keyword match score (0-100) from POST /jobs/:id/match. */
  matchScore: number | null;
  matchCheckedAt: string | null;
  cvVersion?: { id: string; title: string } | null;
  linkedCoverLetter?: { id: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
}

/** Compact job reference used by the dashboard action centre. */
export interface JobBrief {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  followUpDate: string | null;
  appliedAt: string | null;
  updatedAt: string;
}

/** POST /jobs */
export interface CreateJobRequest {
  company: string;
  role: string;
  status?: JobStatus | string;
  url?: string | null;
  notes?: string | null;
  cvVersionId?: string | null;
  coverLetterId?: string | null;
  followUpDate?: string | null;
  jobDescription?: string | null;
  location?: string | null;
  salary?: string | null;
  appliedAt?: string | null;
  keySkills?: string[];
}

/** PATCH /jobs/:id — `null` clears a nullable field; omitted fields are unchanged. */
export type UpdateJobRequest = Partial<CreateJobRequest>;

export interface MatchedKeyword {
  keyword: string;
  weight: number;
  /** Section titles the keyword was found in. */
  foundIn: string[];
}

export interface MissingKeyword {
  keyword: string;
  weight: number;
  suggestedSection: string;
}

export interface AtsCheck {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
}

/** POST /jobs/:id/match and POST /jobs/match-text (deterministic, no AI). */
export interface MatchResult {
  /** 0-100 keyword coverage score — a keyword match, not a hiring prediction. */
  score: number;
  cvVersionId: string;
  checkedAt: string;
  matchedKeywords: MatchedKeyword[];
  missingKeywords: MissingKeyword[];
  atsChecks: AtsCheck[];
}

/** POST /jobs/:id/match */
export interface MatchJobRequest {
  /** Defaults to the job's linked CV, else the most recently updated CV. */
  cvVersionId?: string;
}

/** POST /jobs/match-text */
export interface MatchTextRequest {
  cvVersionId: string;
  jobDescription: string;
}

export type JobSeniority = "junior" | "mid" | "senior" | "lead";

/** POST /jobs/analyze { jobDescription } — AI, 1 action. */
export interface JobDescriptionAnalysis {
  company: string | null;
  role: string | null;
  location: string | null;
  salary: string | null;
  seniority: JobSeniority | null;
  keySkills: string[];
  niceToHave: string[];
  summary: string;
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

/** GET /jobs/insights — `byCvVersion` is null and `locked` true on the free plan. */
export interface JobInsights {
  funnel: JobFunnel;
  rates: {
    response: number | null;
    interview: number | null;
    offer: number | null;
  };
  /** Last 12 weeks, oldest first. */
  weekly: { weekStart: string; count: number }[];
  byCvVersion: CvVersionPerformance[] | null;
  locked: boolean;
}

export type TailorTone = "professional" | "enthusiastic" | "concise";

/** POST /jobs/:id/tailor — Premium only; requires a job description. */
export interface TailorApplicationRequest {
  cvVersionId: string;
  includeCoverLetter: boolean;
  tone?: TailorTone;
}

export interface TailorApplicationResult {
  cvVersion: CvVersion;
  coverLetter: CoverLetter | null;
}
