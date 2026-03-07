import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { AiService } from "../ai/ai.service";
import { AiUsageService } from "../ai/ai-usage.service";
import type { AiCvAction, AiFullCvResult } from "../ai/ai.service";
import {
  FREE_CV_LIMIT,
  FREE_TEMPLATE_IDS,
  DEFAULT_CV_SECTIONS,
} from "../../common/constants";

@Injectable()
export class CvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly aiUsage: AiUsageService
  ) {}

  async getVersions(userId: string) {
    return this.prisma.cvVersion.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { sections: { orderBy: { order: "asc" } } },
    });
  }

  async createVersion(userId: string, title: string) {
    // Enforce free-user cap
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isPremium) {
      const count = await this.prisma.cvVersion.count({ where: { userId } });
      if (count >= FREE_CV_LIMIT) {
        throw new ForbiddenException(
          `Free accounts are limited to ${FREE_CV_LIMIT} CV. Upgrade to Premium for unlimited CVs.`
        );
      }
    }

    const version = await this.prisma.cvVersion.create({
      data: { userId, title },
    });

    // Create default sections in a single batch insert
    await this.prisma.cvSection.createMany({
      data: DEFAULT_CV_SECTIONS.map((s, i) => ({
        cvVersionId: version.id,
        title: s.title,
        sectionType: s.sectionType,
        content: "",
        order: i,
      })),
    });

    return this.prisma.cvVersion.findUnique({
      where: { id: version.id },
      include: { sections: { orderBy: { order: "asc" } } },
    });
  }

  async updateVersion(
    userId: string,
    id: string,
    data: {
      title?: string;
      isActive?: boolean;
      templateId?: string;
      themeConfig?: Record<string, unknown>;
      headerLayout?: string;
      name?: string;
      email?: string;
      photoUrl?: string;
      phone?: string;
      location?: string;
      website?: string;
      linkedin?: string;
      github?: string;
    }
  ) {
    const version = await this.assertVersionOwner(userId, id);

    // Restrict template selection for free users
    if (data.templateId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (
        !user?.isPremium &&
        !(FREE_TEMPLATE_IDS as readonly string[]).includes(data.templateId)
      ) {
        throw new ForbiddenException(
          "Free accounts can only use the first 5 templates. Upgrade to Premium for all templates."
        );
      }
    }

    // If setting active, deactivate others
    if (data.isActive) {
      await this.prisma.cvVersion.updateMany({
        where: { userId },
        data: { isActive: false },
      });
    }

    return this.prisma.cvVersion.update({
      where: { id },
      data: {
        ...data,
        themeConfig: data.themeConfig as any,
      },
      include: { sections: { orderBy: { order: "asc" } } },
    });
  }

  async deleteVersion(userId: string, id: string) {
    await this.assertVersionOwner(userId, id);
    await this.prisma.cvVersion.delete({ where: { id } });
  }

  async getSections(userId: string, versionId: string) {
    await this.assertVersionOwner(userId, versionId);
    return this.prisma.cvSection.findMany({
      where: { cvVersionId: versionId },
      orderBy: { order: "asc" },
    });
  }

  async createSection(
    userId: string,
    versionId: string,
    title: string,
    content?: string,
    sectionType?: string
  ) {
    await this.assertVersionOwner(userId, versionId);
    const maxOrder = await this.prisma.cvSection.aggregate({
      where: { cvVersionId: versionId },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? -1) + 1;

    return this.prisma.cvSection.create({
      data: {
        cvVersionId: versionId,
        title,
        content: content || "",
        sectionType: sectionType || "custom",
        order,
      },
    });
  }

  async updateSection(
    userId: string,
    sectionId: string,
    data: { title?: string; content?: string; sectionType?: string }
  ) {
    const section = await this.assertSectionOwner(userId, sectionId);
    return this.prisma.cvSection.update({ where: { id: sectionId }, data });
  }

  async deleteSection(userId: string, sectionId: string) {
    await this.assertSectionOwner(userId, sectionId);
    await this.prisma.cvSection.delete({ where: { id: sectionId } });
  }

  async moveSection(
    userId: string,
    sectionId: string,
    direction: "up" | "down"
  ) {
    const section = await this.assertSectionOwner(userId, sectionId);
    const sections = await this.prisma.cvSection.findMany({
      where: { cvVersionId: section.cvVersionId },
      orderBy: { order: "asc" },
    });

    const idx = sections.findIndex((s) => s.id === sectionId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return sections;

    // Swap orders
    await this.prisma.$transaction([
      this.prisma.cvSection.update({
        where: { id: sections[idx].id },
        data: { order: sections[swapIdx].order },
      }),
      this.prisma.cvSection.update({
        where: { id: sections[swapIdx].id },
        data: { order: sections[idx].order },
      }),
    ]);

    return this.prisma.cvSection.findMany({
      where: { cvVersionId: section.cvVersionId },
      orderBy: { order: "asc" },
    });
  }

  async duplicateVersion(userId: string, id: string) {
    // Enforce free-user cap
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isPremium) {
      const count = await this.prisma.cvVersion.count({ where: { userId } });
      if (count >= FREE_CV_LIMIT) {
        throw new ForbiddenException(
          `Free accounts are limited to ${FREE_CV_LIMIT} CV. Upgrade to Premium for unlimited CVs.`
        );
      }
    }

    const original = await this.assertVersionOwner(userId, id);
    const originalWithSections = await this.prisma.cvVersion.findUnique({
      where: { id },
      include: { sections: true },
    });
    if (!originalWithSections)
      throw new NotFoundException("CV version not found");

    const copy = await this.prisma.cvVersion.create({
      data: {
        userId,
        title: `${original.title} (Copy)`,
        isActive: false,
        templateId: original.templateId,
        themeConfig: original.themeConfig ?? {},
        headerLayout: original.headerLayout,
        name: originalWithSections.name,
        email: originalWithSections.email,
        photoUrl: originalWithSections.photoUrl,
        phone: originalWithSections.phone,
        location: originalWithSections.location,
        website: originalWithSections.website,
        linkedin: originalWithSections.linkedin,
        github: originalWithSections.github,
      },
    });

    // Batch-insert duplicated sections
    await this.prisma.cvSection.createMany({
      data: originalWithSections.sections.map((section) => ({
        cvVersionId: copy.id,
        title: section.title,
        content: section.content,
        sectionType: section.sectionType,
        order: section.order,
      })),
    });

    return this.prisma.cvVersion.findUnique({
      where: { id: copy.id },
      include: { sections: { orderBy: { order: "asc" } } },
    });
  }

  async reorderSections(
    userId: string,
    versionId: string,
    sectionIds: string[]
  ) {
    await this.assertVersionOwner(userId, versionId);
    const sections = await this.prisma.cvSection.findMany({
      where: { cvVersionId: versionId },
    });

    // Validate all section IDs belong to this version
    const sectionIdSet = new Set(sections.map((s) => s.id));
    for (const id of sectionIds) {
      if (!sectionIdSet.has(id))
        throw new NotFoundException(`Section ${id} not found in this version`);
    }

    // Update orders in a transaction
    await this.prisma.$transaction(
      sectionIds.map((id, index) =>
        this.prisma.cvSection.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return this.prisma.cvSection.findMany({
      where: { cvVersionId: versionId },
      orderBy: { order: "asc" },
    });
  }

  async aiGenerateSection(
    userId: string,
    sectionId: string,
    dto: { action: AiCvAction; jobTitle?: string; jobDescription?: string }
  ) {
    const section = await this.assertSectionOwner(userId, sectionId);

    // Fetch all sibling sections for context
    const allSections = await this.prisma.cvSection.findMany({
      where: { cvVersionId: section.cvVersionId },
      orderBy: { order: "asc" },
    });

    // Fetch user name for personalisation
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const content = await this.aiService.generateCvSectionContent({
      action: dto.action,
      sectionType: section.sectionType,
      sectionTitle: section.title,
      currentContent: section.content,
      jobTitle: dto.jobTitle,
      jobDescription: dto.jobDescription,
      userName: user?.name,
      allSections: allSections
        .filter((s) => s.id !== sectionId)
        .map((s) => ({
          title: s.title,
          sectionType: s.sectionType,
          content: s.content,
        })),
    });

    await this.aiUsage.recordUsage(userId, "cv-section");

    return { content };
  }

  async aiGenerateFullCv(
    userId: string,
    dto: { rawText: string; jobTitle?: string }
  ): Promise<AiFullCvResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const result = await this.aiService.generateFullCvFromRawText({
      rawText: dto.rawText,
      jobTitle: dto.jobTitle,
      userName: user?.name,
    });

    await this.aiUsage.recordUsage(userId, "cv-full");

    return result;
  }

  private async assertVersionOwner(userId: string, versionId: string) {
    const version = await this.prisma.cvVersion.findUnique({
      where: { id: versionId },
    });
    if (!version) throw new NotFoundException("CV version not found");
    if (version.userId !== userId) throw new ForbiddenException();
    return version;
  }

  private async assertSectionOwner(userId: string, sectionId: string) {
    const section = await this.prisma.cvSection.findUnique({
      where: { id: sectionId },
      include: { cvVersion: true },
    });
    if (!section) throw new NotFoundException("Section not found");
    if (section.cvVersion.userId !== userId) throw new ForbiddenException();
    return section;
  }
}
