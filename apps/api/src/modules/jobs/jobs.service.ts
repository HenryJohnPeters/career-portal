import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { lockedTransaction, userLockKey } from "../../common/plan";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { coverLetterNotFound } from "../cover-letters/cover-letters.queries";
import { JOB_FIELD_LIMITS, JOB_LIMITS, normalizeJobStatus } from "./jobs.constants";
import type { CreateJobDto, MatchJobDto, MatchTextDto, UpdateJobDto } from "./jobs.dto";
import { buildJobInsights, type JobInsights } from "./jobs-insights";
import {
  JOB_DETAIL_SELECT,
  JOB_LIST_SELECT,
  MATCH_CV_SELECT,
  cvVersionNotFound,
  jobNotFound,
  toJobListPayload,
  toJobPayload,
  type JobPayload,
} from "./jobs.queries";
import { matchCvToJobDescription, type KeywordMatch } from "./match/match-engine";

/** POST /jobs/:id/match and /jobs/match-text response. */
export type MatchResult = KeywordMatch & { cvVersionId: string; checkedAt: string };

/** Insights read at most this many jobs (above the per-user cap, for old accounts). */
const INSIGHTS_ROW_CAP = 5000;

/** "" never reaches here (the DTO maps it to null); undefined = unchanged. */
function toDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined || value === null) return value;
  return new Date(value);
}

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  /* ── CRUD ───────────────────────────────────────────────────────── */

  /** Most recently updated first, without job descriptions (see `hasJobDescription`). */
  async findAll(userId: string): Promise<JobPayload[]> {
    const [rows, withDescription] = await Promise.all([
      this.prisma.job.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: JOB_FIELD_LIMITS.listCap,
        select: JOB_LIST_SELECT,
      }),
      this.prisma.job.findMany({
        where: { userId, jobDescription: { not: null } },
        select: { id: true },
      }),
    ]);
    const described = new Set(withDescription.map((job) => job.id));
    return rows.map((row) => toJobListPayload(row, described.has(row.id)));
  }

  async findOne(userId: string, id: string): Promise<JobPayload> {
    const row = await this.prisma.job.findFirst({
      where: { id, userId },
      select: JOB_DETAIL_SELECT,
    });
    if (!row) throw jobNotFound();
    return toJobPayload(row);
  }

  async create(userId: string, dto: CreateJobDto): Promise<JobPayload> {
    await this.assertOwnedLinks(userId, dto);
    const status = dto.status ?? "applied";
    const appliedAt =
      dto.appliedAt !== undefined
        ? toDate(dto.appliedAt)
        : status === "wishlist"
          ? null
          : new Date();

    const row = await lockedTransaction(this.prisma, userLockKey("job", userId), async (tx) => {
      const count = await tx.job.count({ where: { userId } });
      if (count >= JOB_LIMITS.jobsPerUser) {
        throw new ForbiddenException(
          `You can track up to ${JOB_LIMITS.jobsPerUser.toLocaleString("en-GB")} jobs. Delete old applications to add new ones.`,
        );
      }
      return tx.job.create({
        data: {
          userId,
          company: dto.company,
          role: dto.role,
          status,
          url: dto.url ?? null,
          notes: dto.notes ?? null,
          cvVersionId: dto.cvVersionId ?? null,
          coverLetterId: dto.coverLetterId ?? null,
          followUpDate: toDate(dto.followUpDate) ?? null,
          jobDescription: dto.jobDescription ?? null,
          location: dto.location ?? null,
          salary: dto.salary ?? null,
          appliedAt,
          keySkills: dto.keySkills ?? [],
        },
        select: JOB_DETAIL_SELECT,
      });
    });
    return toJobPayload(row);
  }

  /**
   * Partial update: undefined = unchanged, null clears. Leaving the wishlist
   * stamps `appliedAt` (when not set); a changed job description or linked
   * CV clears the now-stale match score (`matchCheckedAt` stays: it records
   * that a check was run, which onboarding counts).
   */
  async update(userId: string, id: string, dto: UpdateJobDto): Promise<JobPayload> {
    const current = await this.prisma.job.findFirst({
      where: { id, userId },
      select: { status: true, appliedAt: true, jobDescription: true, cvVersionId: true },
    });
    if (!current) throw jobNotFound();
    await this.assertOwnedLinks(userId, dto);

    const data: Prisma.JobUncheckedUpdateInput = {
      company: dto.company,
      role: dto.role,
      status: dto.status,
      url: dto.url,
      notes: dto.notes,
      cvVersionId: dto.cvVersionId,
      coverLetterId: dto.coverLetterId,
      followUpDate: toDate(dto.followUpDate),
      jobDescription: dto.jobDescription,
      location: dto.location,
      salary: dto.salary,
      appliedAt: toDate(dto.appliedAt),
      keySkills: dto.keySkills,
    };
    const leavesWishlist =
      dto.status !== undefined &&
      dto.status !== "wishlist" &&
      normalizeJobStatus(current.status) === "wishlist";
    if (dto.appliedAt === undefined && leavesWishlist && !current.appliedAt) {
      data.appliedAt = new Date();
    }
    const descriptionChanged =
      dto.jobDescription !== undefined && dto.jobDescription !== current.jobDescription;
    const cvChanged = dto.cvVersionId !== undefined && dto.cvVersionId !== current.cvVersionId;
    if (descriptionChanged || cvChanged) {
      data.matchScore = null;
    }

    // A delete racing this update surfaces as P2025 → 404 via the global filter.
    const row = await this.prisma.job.update({
      where: { id },
      data,
      select: JOB_DETAIL_SELECT,
    });
    return toJobPayload(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.job.deleteMany({ where: { id, userId } });
    if (count === 0) throw jobNotFound();
  }

  /* ── Keyword match ──────────────────────────────────────────────── */

  /**
   * Scores a CV against the job's description and saves the score on the
   * job. The CV defaults to the job's linked CV, else the most recently
   * updated one.
   */
  async match(userId: string, jobId: string, dto: MatchJobDto): Promise<MatchResult> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, userId },
      select: { jobDescription: true, cvVersionId: true },
    });
    if (!job) throw jobNotFound();
    if (!job.jobDescription?.trim()) {
      throw new BadRequestException(
        "Add the job description to this job to check your CV against it.",
      );
    }
    const cv = await this.loadCvForMatch(userId, dto.cvVersionId ?? job.cvVersionId);
    const result = this.score(cv, job.jobDescription);

    const { count } = await this.prisma.job.updateMany({
      where: { id: jobId, userId },
      data: { matchScore: result.score, matchCheckedAt: new Date(result.checkedAt) },
    });
    if (count === 0) throw jobNotFound();
    return result;
  }

  /** Scores a CV against pasted text; nothing is saved. */
  async matchText(userId: string, dto: MatchTextDto): Promise<MatchResult> {
    const cv = await this.loadCvForMatch(userId, dto.cvVersionId);
    return this.score(cv, dto.jobDescription);
  }

  /* ── Insights ───────────────────────────────────────────────────── */

  /** Funnel, rates and weekly volume for everyone; the per-CV breakdown is Premium. */
  async insights(userId: string): Promise<JobInsights> {
    const [plan, jobs, cvVersions] = await Promise.all([
      this.entitlements.getPlan(userId),
      this.prisma.job.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { status: true, appliedAt: true, createdAt: true, cvVersionId: true },
        take: INSIGHTS_ROW_CAP,
      }),
      this.prisma.cvVersion.findMany({
        where: { userId },
        select: { id: true, title: true },
      }),
    ]);
    return buildJobInsights(jobs, {
      now: new Date(),
      includeByCv: plan.isPremium,
      cvTitles: new Map(cvVersions.map((cv) => [cv.id, cv.title])),
    });
  }

  /* ── Internals ──────────────────────────────────────────────────── */

  private score(
    cv: Prisma.CvVersionGetPayload<{ select: typeof MATCH_CV_SELECT }>,
    jobDescription: string,
  ): MatchResult {
    // A blank CV email prints the account email (as the PDF does).
    const { id, user, ...cvContent } = cv;
    return {
      ...matchCvToJobDescription(
        { ...cvContent, email: cvContent.email || user.email },
        jobDescription,
      ),
      cvVersionId: id,
      checkedAt: new Date().toISOString(),
    };
  }

  private async loadCvForMatch(userId: string, cvVersionId: string | null | undefined) {
    const cv = await this.prisma.cvVersion.findFirst({
      where: cvVersionId ? { id: cvVersionId, userId } : { userId },
      orderBy: { updatedAt: "desc" },
      select: MATCH_CV_SELECT,
    });
    if (cv) return cv;
    if (cvVersionId) throw cvVersionNotFound();
    throw new BadRequestException("Create a CV first, then check it against this job.");
  }

  /** Linked CV / cover-letter ids must be the user's own (404 otherwise). */
  private async assertOwnedLinks(
    userId: string,
    links: { cvVersionId?: string | null; coverLetterId?: string | null },
  ): Promise<void> {
    const [cv, letter] = await Promise.all([
      links.cvVersionId
        ? this.prisma.cvVersion.findFirst({
            where: { id: links.cvVersionId, userId },
            select: { id: true },
          })
        : undefined,
      links.coverLetterId
        ? this.prisma.coverLetter.findFirst({
            where: { id: links.coverLetterId, userId },
            select: { id: true },
          })
        : undefined,
    ]);
    if (cv === null) throw cvVersionNotFound();
    if (letter === null) throw coverLetterNotFound();
  }
}
