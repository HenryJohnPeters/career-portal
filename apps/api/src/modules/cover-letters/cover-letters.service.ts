import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { AiService } from "../ai/ai.service";
import { AiUsageService } from "../ai/ai-usage.service";
import { FREE_TIER } from "../../common/constants";
import { isActivePremium } from "../../common/subscription.util";

@Injectable()
export class CoverLettersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly aiUsage: AiUsageService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: { job: true },
    });
  }

  async create(
    userId: string,
    data: { title: string; body?: string; jobId?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !isActivePremium(user)) {
      return this.prisma.$transaction(
        async (tx) => {
          const count = await tx.coverLetter.count({ where: { userId } });
          if (count >= FREE_TIER.coverLetters) {
            throw new ForbiddenException(
              `Free accounts are limited to ${FREE_TIER.coverLetters} cover letters. Upgrade to Premium for unlimited cover letters.`,
            );
          }

          return tx.coverLetter.create({
            data: {
              userId,
              title: data.title,
              body: data.body || "",
              jobId: data.jobId || null,
            },
            include: { job: true },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    }

    return this.prisma.coverLetter.create({
      data: {
        userId,
        title: data.title,
        body: data.body || "",
        jobId: data.jobId || null,
      },
      include: { job: true },
    });
  }

  async update(
    userId: string,
    id: string,
    data: { title?: string; body?: string; jobId?: string },
  ) {
    await this.assertOwner(userId, id);
    return this.prisma.coverLetter.update({
      where: { id },
      data,
      include: { job: true },
    });
  }

  async delete(userId: string, id: string) {
    await this.assertOwner(userId, id);
    await this.prisma.coverLetter.delete({ where: { id } });
  }

  async suggest(userId: string, id: string) {
    const letter = await this.assertOwner(userId, id);

    if (!letter.body || letter.body.trim().length === 0) {
      return [
        "Your cover letter is empty. Start with a greeting and introduction.",
        "Consider using the AI Generate feature to create a complete cover letter from your CV.",
      ];
    }

    return this.aiUsage.withReservation(
      userId,
      "cover-letter-suggest",
      async () => {
        const { jobTitle, companyName, jobDescription } =
          await this.resolveJobContext(letter.jobId);

        return this.aiService.suggestCoverLetterImprovements(
          letter.body.slice(0, 3000),
          jobTitle,
          companyName,
          jobDescription,
        );
      },
    );
  }

  async rewrite(
    userId: string,
    id: string,
    tone?: "professional" | "friendly",
  ) {
    const letter = await this.assertOwner(userId, id);
    const body = letter.body || "";
    const selectedTone = tone || "professional";

    if (!body.trim()) {
      return selectedTone === "professional"
        ? "Dear Hiring Manager,\n\nI am writing to express my interest in the position at your company. With my background and skills, I am confident I would be a valuable addition to your team.\n\nI look forward to the opportunity to discuss how my experience aligns with your needs.\n\nSincerely,\n[Your Name]"
        : "Hi there!\n\nI'm really excited about this opportunity and would love to be part of your team. I think my skills and enthusiasm would be a great fit.\n\nLooking forward to chatting more about how I can contribute!\n\nBest,\n[Your Name]";
    }

    return this.aiUsage.withReservation(
      userId,
      "cover-letter-rewrite",
      async () => {
        const { jobTitle, companyName } = await this.resolveJobContext(
          letter.jobId,
        );

        return this.aiService.rewriteCoverLetter(
          body.slice(0, 3000),
          selectedTone,
          jobTitle,
          companyName,
        );
      },
    );
  }

  async aiGenerate(
    userId: string,
    id: string,
    dto: {
      action: "generate" | "improve" | "tailor";
      jobTitle?: string;
      companyName?: string;
      companyUrl?: string;
      jobDescription?: string;
      tone?: "professional" | "friendly";
      cvVersionId?: string;
    },
  ) {
    const letter = await this.assertOwner(userId, id);

    return this.aiUsage.withReservation(userId, "cover-letter", async () => {
      const [cvVersion, user] = await Promise.all([
        dto.cvVersionId
          ? this.prisma.cvVersion.findFirst({
              where: { id: dto.cvVersionId, userId },
              include: { sections: { orderBy: { order: "asc" } } },
            })
          : this.resolveActiveCv(userId),
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        }),
      ]);

      let { jobTitle, companyName, companyUrl, jobDescription } = dto;
      if (letter.jobId && (!jobTitle || !companyName)) {
        const job = await this.prisma.job.findUnique({
          where: { id: letter.jobId },
        });
        if (job) {
          jobTitle = jobTitle || job.role;
          companyName = companyName || job.company;
          jobDescription = jobDescription || job.notes || undefined;
        }
      }

      const content = await this.aiService.generateCoverLetterContent({
        action: dto.action,
        currentBody: letter.body ? letter.body.slice(0, 3000) : undefined,
        jobTitle,
        companyName,
        companyUrl,
        jobDescription,
        tone: dto.tone || "professional",
        userName: user?.name,
        cvSections: cvVersion?.sections.map((s) => ({
          title: s.title,
          sectionType: s.sectionType,
          content: s.content,
        })),
      });

      return { content };
    });
  }

  // ── Private helpers ────────────────────────────────────────

  /** Fetch the active CV version, falling back to the most recently updated. */
  private async resolveActiveCv(userId: string) {
    return this.prisma.cvVersion.findFirst({
      where: { userId },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      include: { sections: { orderBy: { order: "asc" } } },
    });
  }

  /** Resolve job context from a linked job id. */
  private async resolveJobContext(jobId: string | null): Promise<{
    jobTitle?: string;
    companyName?: string;
    jobDescription?: string;
  }> {
    if (!jobId) return {};
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return {};
    return {
      jobTitle: job.role,
      companyName: job.company,
      jobDescription: job.notes || undefined,
    };
  }

  private async assertOwner(userId: string, id: string) {
    const letter = await this.prisma.coverLetter.findUnique({ where: { id } });
    if (!letter) throw new NotFoundException("Cover letter not found");
    if (letter.userId !== userId) throw new ForbiddenException();
    return letter;
  }
}
