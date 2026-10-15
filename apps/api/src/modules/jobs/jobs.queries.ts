import { NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { normalizeJobStatus, type JobStatus } from "./jobs.constants";

/** Every Job column except the (up to 20k-char) job description. */
export const JOB_LIST_SELECT = {
  id: true,
  userId: true,
  company: true,
  role: true,
  status: true,
  url: true,
  notes: true,
  cvVersionId: true,
  coverLetterId: true,
  followUpDate: true,
  location: true,
  salary: true,
  appliedAt: true,
  keySkills: true,
  matchScore: true,
  matchCheckedAt: true,
  createdAt: true,
  updatedAt: true,
  cvVersion: { select: { id: true, title: true } },
  linkedCoverLetter: { select: { id: true, title: true } },
} as const satisfies Prisma.JobSelect;

export const JOB_DETAIL_SELECT = {
  ...JOB_LIST_SELECT,
  jobDescription: true,
} as const satisfies Prisma.JobSelect;

type JobListRow = Prisma.JobGetPayload<{ select: typeof JOB_LIST_SELECT }>;
type JobDetailRow = Prisma.JobGetPayload<{ select: typeof JOB_DETAIL_SELECT }>;

/** The `Job` API shape (libs/shared/types jobs.ts). */
export type JobPayload = Omit<JobDetailRow, "status"> & {
  status: JobStatus;
  hasJobDescription: boolean;
};

export function toJobPayload(row: JobDetailRow): JobPayload {
  return {
    ...row,
    status: normalizeJobStatus(row.status),
    hasJobDescription: !!row.jobDescription,
  };
}

/** List rows carry `jobDescription: null`; `hasJobDescription` says whether one exists. */
export function toJobListPayload(row: JobListRow, hasJobDescription: boolean): JobPayload {
  return {
    ...row,
    jobDescription: null,
    status: normalizeJobStatus(row.status),
    hasJobDescription,
  };
}

/** Compact job reference (dashboard action centre). */
export const JOB_BRIEF_SELECT = {
  id: true,
  company: true,
  role: true,
  status: true,
  followUpDate: true,
  appliedAt: true,
  updatedAt: true,
} as const satisfies Prisma.JobSelect;

export type JobBriefRow = Prisma.JobGetPayload<{ select: typeof JOB_BRIEF_SELECT }>;
export type JobBrief = Omit<JobBriefRow, "status"> & { status: JobStatus };

export function toJobBrief(row: JobBriefRow): JobBrief {
  return { ...row, status: normalizeJobStatus(row.status) };
}

/** CV fields the keyword match reads. */
export const MATCH_CV_SELECT = {
  id: true,
  email: true,
  phone: true,
  photoUrl: true,
  /** The PDF falls back to the account email when the CV's is blank. */
  user: { select: { email: true } },
  sections: {
    select: { title: true, sectionType: true, content: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    take: 30,
  },
} as const satisfies Prisma.CvVersionSelect;

export const jobNotFound = () => new NotFoundException("Job not found");
export const cvVersionNotFound = () => new NotFoundException("CV version not found");
