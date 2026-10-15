import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

/** Per-user cap on cover letters for every plan (free has a lower quota). */
export const MAX_COVER_LETTERS_PER_USER = 500;

export const COVER_LETTER_LIMITS = {
  title: 200,
  body: 15_000,
} as const;

const JOB_REF_SELECT = { id: true, company: true, role: true } as const;

/**
 * Full letter plus its job. The job is `CoverLetter.jobId`, or else the most
 * recently updated tracked job whose `coverLetterId` points at the letter.
 */
export const COVER_LETTER_SELECT = {
  id: true,
  userId: true,
  title: true,
  body: true,
  jobId: true,
  createdAt: true,
  updatedAt: true,
  job: { select: JOB_REF_SELECT },
  linkedFromJobs: {
    select: JOB_REF_SELECT,
    orderBy: { updatedAt: "desc" },
    take: 1,
  },
} as const satisfies Prisma.CoverLetterSelect;

/** GET /cover-letters?summary=1 rows (no bodies). */
export const COVER_LETTER_SUMMARY_SELECT = {
  id: true,
  title: true,
  jobId: true,
  updatedAt: true,
} as const satisfies Prisma.CoverLetterSelect;

type CoverLetterRow = Prisma.CoverLetterGetPayload<{ select: typeof COVER_LETTER_SELECT }>;

export interface CoverLetterJobRef {
  id: string;
  company: string;
  role: string;
}

/** The `CoverLetter` API shape (libs/shared/types cover-letters.ts). */
export type CoverLetterPayload = Omit<CoverLetterRow, "job" | "linkedFromJobs"> & {
  job: CoverLetterJobRef | null;
};

export function toCoverLetterPayload(row: CoverLetterRow): CoverLetterPayload {
  const { job, linkedFromJobs, ...letter } = row;
  return { ...letter, job: job ?? linkedFromJobs[0] ?? null };
}

export const coverLetterNotFound = () => new NotFoundException("Cover letter not found");

export const coverLetterCapReached = () =>
  new ForbiddenException(
    `You can keep up to ${MAX_COVER_LETTERS_PER_USER} cover letters. Delete some to create new ones.`,
  );
