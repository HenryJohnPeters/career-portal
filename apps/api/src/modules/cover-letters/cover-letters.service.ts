import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { AiService } from "../ai/ai.service";
import { AiUsageService } from "../ai/ai-usage.service";
import { FREE_COVER_LETTER_LIMIT } from "../../common/constants";

@Injectable()
export class CoverLettersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly aiUsage: AiUsageService
  ) {}

  async findAll(userId: string) {
    return this.prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { job: true },
    });
  }

  async create(
    userId: string,
    data: { title: string; body?: string; jobId?: string }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isPremium) {
      const count = await this.prisma.coverLetter.count({ where: { userId } });
      if (count >= FREE_COVER_LETTER_LIMIT) {
        throw new ForbiddenException(
          `Free accounts are limited to ${FREE_COVER_LETTER_LIMIT} cover letters. Upgrade to Premium for unlimited cover letters.`
        );
      }
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
    data: { title?: string; body?: string; jobId?: string }
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

    // Enforce monthly AI limit
    const canUse = await this.aiUsage.canUseAi(userId);
    if (!canUse) {
      throw new ForbiddenException(
        "You have reached your monthly AI limit. Upgrade to Premium for unlimited AI usage."
      );
    }

    const { jobTitle, companyName, jobDescription } =
      await this.resolveJobContext(letter.jobId);

    const result = await this.aiService.suggestCoverLetterImprovements(
      letter.body.slice(0, 3000),
      jobTitle,
      companyName,
      jobDescription
    );

    // Record usage only after a successful OpenAI response
    await this.aiUsage.recordUsage(userId, "cover-letter-suggest");

    return result;
  }

  async rewrite(
    userId: string,
    id: string,
    tone?: "professional" | "friendly"
  ) {
    const letter = await this.assertOwner(userId, id);
    const body = letter.body || "";
    const selectedTone = tone || "professional";

    if (!body.trim()) {
      return selectedTone === "professional"
        ? "Dear Hiring Manager,\n\nI am writing to express my interest in the position at your company. With my background and skills, I am confident I would be a valuable addition to your team.\n\nI look forward to the opportunity to discuss how my experience aligns with your needs.\n\nSincerely,\n[Your Name]"
        : "Hi there!\n\nI'm really excited about this opportunity and would love to be part of your team. I think my skills and enthusiasm would be a great fit.\n\nLooking forward to chatting more about how I can contribute!\n\nBest,\n[Your Name]";
    }

    // Enforce monthly AI limit
    const canUse = await this.aiUsage.canUseAi(userId);
    if (!canUse) {
      throw new ForbiddenException(
        "You have reached your monthly AI limit. Upgrade to Premium for unlimited AI usage."
      );
    }

    const { jobTitle, companyName } = await this.resolveJobContext(
      letter.jobId
    );

    const result = await this.aiService.rewriteCoverLetter(
      body.slice(0, 3000),
      selectedTone,
      jobTitle,
      companyName
    );

    // Record usage only after a successful OpenAI response
    await this.aiUsage.recordUsage(userId, "cover-letter-rewrite");

    return result;
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
    }
  ) {
    const letter = await this.assertOwner(userId, id);

    // Enforce monthly AI limit
    const canUse = await this.aiUsage.canUseAi(userId);
    if (!canUse) {
      throw new ForbiddenException(
        "You have reached your monthly AI limit. Upgrade to Premium for unlimited AI usage."
      );
    }

    const cvVersion = await this.resolveActiveCv(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

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

    // Record usage only after a successful OpenAI response
    await this.aiUsage.recordUsage(userId, "cover-letter");

    return { content };
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
