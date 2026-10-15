import { BadRequestException, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { CooldownException } from "../../common/errors";
import { lockedTransaction, userLockKey } from "../../common/plan";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { AiService } from "../ai/ai.service";
import type { JobDescriptionAnalysis } from "../ai/ai.types";
import {
  CV_VERSION_SELECT,
  SECTION_ORDER,
  toCvVersionPayload,
  type CvVersionPayload,
} from "../cv/cv.queries";
import {
  COVER_LETTER_LIMITS,
  COVER_LETTER_SELECT,
  MAX_COVER_LETTERS_PER_USER,
  coverLetterCapReached,
  toCoverLetterPayload,
  type CoverLetterPayload,
} from "../cover-letters/cover-letters.queries";
import type { TailorApplicationDto } from "./jobs.dto";
import { cvVersionNotFound, jobNotFound } from "./jobs.queries";

export interface TailorApplicationResult {
  cvVersion: CvVersionPayload;
  coverLetter: CoverLetterPayload | null;
}

/** Version title limit (CV_LIMITS.versionTitle). */
const CV_TITLE_MAX = 120;
/** How long a second tailor request from the same user is told to wait. */
const TAILOR_BUSY_RETRY_SECONDS = 15;

/** The base CV, copied whole (theme, contact, sections) into the tailored version. */
const BASE_CV_SELECT = {
  templateId: true,
  themeConfig: true,
  headerLayout: true,
  name: true,
  email: true,
  photoUrl: true,
  phone: true,
  location: true,
  website: true,
  linkedin: true,
  github: true,
  sections: {
    select: { id: true, title: true, sectionType: true, content: true },
    orderBy: SECTION_ORDER,
  },
} as const satisfies Prisma.CvVersionSelect;

function clamp(text: string, max: number): string {
  return Array.from(text).slice(0, max).join("");
}

@Injectable()
export class JobsAiService {
  /** Users with a tailor run in progress on this instance (stops double-submits paying twice). */
  private readonly tailoring = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly entitlements: EntitlementsService,
  ) {}

  /** 1 AI action; usage is reserved and recorded by AiService. */
  analyze(userId: string, jobDescription: string): Promise<JobDescriptionAnalysis> {
    return this.aiService.analyzeJobDescription(userId, jobDescription);
  }

  /**
   * Premium tailor kit. The AI runs first, outside any transaction; then one
   * transaction creates the tailored CV version (a copy of the base with the
   * tailored sections), the optional cover letter, and links both to the
   * job. A failure at any step leaves nothing half-created.
   */
  async tailor(
    userId: string,
    jobId: string,
    dto: TailorApplicationDto,
  ): Promise<TailorApplicationResult> {
    await this.entitlements.assertPremium(userId, "tailorKit");
    if (this.tailoring.has(userId)) {
      throw new CooldownException(
        TAILOR_BUSY_RETRY_SECONDS,
        "A tailored application is already being created. Please wait for it to finish.",
      );
    }
    this.tailoring.add(userId);
    try {
      return await this.runTailor(userId, jobId, dto);
    } finally {
      this.tailoring.delete(userId);
    }
  }

  private async runTailor(
    userId: string,
    jobId: string,
    dto: TailorApplicationDto,
  ): Promise<TailorApplicationResult> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, userId },
      select: { id: true, company: true, role: true, jobDescription: true },
    });
    if (!job) throw jobNotFound();
    const jobDescription = job.jobDescription?.trim();
    if (!jobDescription) {
      throw new BadRequestException("Add the job description to this job before tailoring.");
    }

    const [base, user, letterCount] = await Promise.all([
      this.prisma.cvVersion.findFirst({
        where: { id: dto.cvVersionId, userId },
        select: BASE_CV_SELECT,
      }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      dto.includeCoverLetter ? this.prisma.coverLetter.count({ where: { userId } }) : 0,
    ]);
    if (!base) throw cvVersionNotFound();
    if (letterCount >= MAX_COVER_LETTERS_PER_USER) throw coverLetterCapReached();

    const result = await this.aiService.tailorApplication(userId, {
      company: job.company,
      role: job.role,
      jobDescription,
      userName: user?.name ?? "",
      tone: dto.tone,
      sections: base.sections,
      includeCoverLetter: dto.includeCoverLetter,
    });
    const tailored = new Map(result.sections.map((s) => [s.id, s.content]));
    const { sections, themeConfig, ...copied } = base;

    return lockedTransaction(this.prisma, userLockKey("cover-letter", userId), async (tx) => {
      if (result.coverLetter !== null) {
        const letters = await tx.coverLetter.count({ where: { userId } });
        if (letters >= MAX_COVER_LETTERS_PER_USER) throw coverLetterCapReached();
      }

      const version = await tx.cvVersion.create({
        data: {
          ...copied,
          userId,
          title: clamp(`${job.role} @ ${job.company}`, CV_TITLE_MAX),
          isActive: false,
          themeConfig: (themeConfig ?? {}) as Prisma.InputJsonValue,
          sections: {
            createMany: {
              data: sections.map((section, order) => ({
                title: section.title,
                sectionType: section.sectionType,
                content: tailored.get(section.id) ?? section.content,
                order,
              })),
            },
          },
        },
        select: CV_VERSION_SELECT,
      });

      const letter =
        result.coverLetter === null
          ? null
          : await tx.coverLetter.create({
              data: {
                userId,
                jobId: job.id,
                title: clamp(`Cover letter: ${job.role} @ ${job.company}`, COVER_LETTER_LIMITS.title),
                body: result.coverLetter,
              },
              select: COVER_LETTER_SELECT,
            });

      const linked = await tx.job.updateMany({
        where: { id: job.id, userId },
        data: { cvVersionId: version.id, ...(letter && { coverLetterId: letter.id }) },
      });
      if (linked.count === 0) throw jobNotFound();

      return {
        cvVersion: toCvVersionPayload(version, false),
        coverLetter: letter && toCoverLetterPayload(letter),
      };
    });
  }
}
