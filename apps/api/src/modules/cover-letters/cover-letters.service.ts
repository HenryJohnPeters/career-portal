import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { QuotaExceededException } from "../../common/errors";
import { lockedTransaction, userLockKey } from "../../common/plan";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { AiService } from "../ai/ai.service";
import type { AiContextSection, AiTextResult } from "../ai/ai.types";
import { cvVersionNotFound, jobNotFound } from "../jobs/jobs.queries";
import type {
  AiGenerateCoverLetterDto,
  CreateCoverLetterDto,
  RewriteDto,
  SuggestCoverLetterDto,
  UpdateCoverLetterDto,
} from "./cover-letters.dto";
import {
  COVER_LETTER_SELECT,
  COVER_LETTER_SUMMARY_SELECT,
  MAX_COVER_LETTERS_PER_USER,
  coverLetterCapReached,
  coverLetterNotFound,
  toCoverLetterPayload,
  type CoverLetterPayload,
} from "./cover-letters.queries";

/** The full list is capped at the per-user maximum, newest first. */
const LIST_CAP = MAX_COVER_LETTERS_PER_USER;
/** CV sections read for AI context (the AI keeps the most useful ~10 within a size budget). */
const CV_CONTEXT_SECTIONS = 30;

const CV_CONTEXT_SELECT = {
  sections: {
    where: { content: { not: "" } },
    select: { title: true, sectionType: true, content: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    take: CV_CONTEXT_SECTIONS,
  },
} as const satisfies Prisma.CvVersionSelect;

/** Job fields used as AI context for a letter. */
const JOB_CONTEXT_SELECT = {
  role: true,
  company: true,
  url: true,
  jobDescription: true,
  notes: true,
} as const satisfies Prisma.JobSelect;

interface JobContext {
  jobTitle?: string;
  companyName?: string;
  companyUrl?: string;
  /** The job's description, else its notes (older jobs kept the advert there). */
  jobDescription?: string;
}

export interface CoverLetterSummary {
  id: string;
  title: string;
  jobId: string | null;
  updatedAt: Date;
}

const nonEmpty = (value: string | null | undefined) => value?.trim() || undefined;

@Injectable()
export class CoverLettersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly entitlements: EntitlementsService,
  ) {}

  /* ── CRUD ───────────────────────────────────────────────────────── */

  async findAll(userId: string): Promise<CoverLetterPayload[]> {
    const rows = await this.prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: LIST_CAP,
      select: COVER_LETTER_SELECT,
    });
    return rows.map(toCoverLetterPayload);
  }

  /** Lightweight list for pickers: no bodies. */
  findSummaries(userId: string): Promise<CoverLetterSummary[]> {
    return this.prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: LIST_CAP,
      select: COVER_LETTER_SUMMARY_SELECT,
    });
  }

  /**
   * Free plan: up to FREE_TIER.coverLetters letters (403 quota_exceeded).
   * Every plan: up to MAX_COVER_LETTERS_PER_USER. The count and insert run
   * under a per-user lock, so parallel requests cannot overshoot.
   */
  async create(userId: string, dto: CreateCoverLetterDto): Promise<CoverLetterPayload> {
    const [plan] = await Promise.all([
      this.entitlements.getPlan(userId),
      this.assertOwnedJob(userId, dto.jobId),
    ]);
    const freeLimit = plan.limits.coverLetters;

    const row = await lockedTransaction(
      this.prisma,
      userLockKey("cover-letter", userId),
      async (tx) => {
        const used = await tx.coverLetter.count({ where: { userId } });
        if (freeLimit !== null && used >= freeLimit) {
          throw new QuotaExceededException("coverLetters", freeLimit, used, null);
        }
        if (used >= MAX_COVER_LETTERS_PER_USER) throw coverLetterCapReached();
        return tx.coverLetter.create({
          data: {
            userId,
            title: dto.title,
            body: dto.body ?? "",
            jobId: dto.jobId ?? null,
          },
          select: COVER_LETTER_SELECT,
        });
      },
    );
    return toCoverLetterPayload(row);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCoverLetterDto,
  ): Promise<CoverLetterPayload> {
    await Promise.all([this.assertOwner(userId, id), this.assertOwnedJob(userId, dto.jobId)]);
    // A delete racing this update surfaces as P2025 → 404 via the global filter.
    const row = await this.prisma.coverLetter.update({
      where: { id },
      data: { title: dto.title, body: dto.body, jobId: dto.jobId },
      select: COVER_LETTER_SELECT,
    });
    return toCoverLetterPayload(row);
  }

  async delete(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.coverLetter.deleteMany({ where: { id, userId } });
    if (count === 0) throw coverLetterNotFound();
  }

  /* ── AI ─────────────────────────────────────────────────────────── */
  // AiService validates input (400 before any quota is reserved), reserves
  // usage and records the outcome, so nothing here wraps it in a reservation.

  async suggest(userId: string, id: string, dto: SuggestCoverLetterDto): Promise<string[]> {
    const letter = await this.loadForAi(userId, id);
    const job = await this.resolveJobContext(userId, letter);
    return this.aiService.suggestCoverLetterImprovements(userId, {
      body: dto.currentBody ?? letter.body,
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      jobDescription: job.jobDescription,
    });
  }

  /** Returns the rewritten letter text. */
  async rewrite(userId: string, id: string, dto: RewriteDto): Promise<string> {
    const letter = await this.loadForAi(userId, id);
    const job = await this.resolveJobContext(userId, letter);
    const result = await this.aiService.rewriteCoverLetter(userId, {
      body: dto.currentBody ?? letter.body,
      tone: dto.tone ?? "professional",
      jobTitle: job.jobTitle,
      companyName: job.companyName,
    });
    return result.content;
  }

  /**
   * Generate / improve / tailor. Request fields win over the linked job's
   * details. With `useCv: false` no CV is loaded or sent; otherwise the
   * chosen CV (404 if it isn't the user's) or the active one is used.
   */
  async aiGenerate(
    userId: string,
    id: string,
    dto: AiGenerateCoverLetterDto,
  ): Promise<AiTextResult> {
    const letter = await this.loadForAi(userId, id);
    const useCv = dto.useCv !== false;
    const [cvSections, user, job] = await Promise.all([
      useCv ? this.loadCvContext(userId, dto.cvVersionId) : undefined,
      this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      this.resolveJobContext(userId, letter),
    ]);

    return this.aiService.generateCoverLetterContent(userId, {
      action: dto.action,
      currentBody: dto.currentBody ?? letter.body,
      jobTitle: nonEmpty(dto.jobTitle) ?? job.jobTitle,
      companyName: nonEmpty(dto.companyName) ?? job.companyName,
      companyUrl: nonEmpty(dto.companyUrl) ?? job.companyUrl,
      jobDescription: nonEmpty(dto.jobDescription) ?? job.jobDescription,
      cvSections,
      useCv,
      userName: user?.name,
      tone: dto.tone ?? "professional",
    });
  }

  /* ── Internals ──────────────────────────────────────────────────── */

  private async assertOwner(userId: string, id: string): Promise<void> {
    const letter = await this.prisma.coverLetter.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!letter) throw coverLetterNotFound();
  }

  /** A job id being linked must be the user's own (404 otherwise); null/undefined pass. */
  private async assertOwnedJob(userId: string, jobId: string | null | undefined): Promise<void> {
    if (!jobId) return;
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, userId },
      select: { id: true },
    });
    if (!job) throw jobNotFound();
  }

  private async loadForAi(userId: string, id: string) {
    const letter = await this.prisma.coverLetter.findFirst({
      where: { id, userId },
      select: { id: true, body: true, jobId: true },
    });
    if (!letter) throw coverLetterNotFound();
    return letter;
  }

  /** Sections of the chosen CV (404 if not the user's) or of the active / latest CV. */
  private async loadCvContext(
    userId: string,
    cvVersionId: string | undefined,
  ): Promise<AiContextSection[] | undefined> {
    const cv = await this.prisma.cvVersion.findFirst({
      where: cvVersionId ? { id: cvVersionId, userId } : { userId },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      select: CV_CONTEXT_SELECT,
    });
    if (!cv && cvVersionId) throw cvVersionNotFound();
    return cv?.sections;
  }

  /**
   * The letter's job: `CoverLetter.jobId`, else the most recently updated
   * tracked job that links this letter (`Job.coverLetterId`).
   */
  private async resolveJobContext(
    userId: string,
    letter: { id: string; jobId: string | null },
  ): Promise<JobContext> {
    const job =
      (letter.jobId
        ? await this.prisma.job.findFirst({
            where: { id: letter.jobId, userId },
            select: JOB_CONTEXT_SELECT,
          })
        : null) ??
      (await this.prisma.job.findFirst({
        where: { userId, coverLetterId: letter.id },
        orderBy: { updatedAt: "desc" },
        select: JOB_CONTEXT_SELECT,
      }));
    if (!job) return {};
    return {
      jobTitle: nonEmpty(job.role),
      companyName: nonEmpty(job.company),
      companyUrl: nonEmpty(job.url),
      jobDescription: nonEmpty(job.jobDescription) ?? nonEmpty(job.notes),
    };
  }
}
