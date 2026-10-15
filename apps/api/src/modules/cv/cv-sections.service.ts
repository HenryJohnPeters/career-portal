import { BadRequestException, Injectable } from "@nestjs/common";
import type { CvSection } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { lockedTransaction, userLockKey } from "../../common/plan";
import { CV_LIMITS, type SectionType } from "./cv.rules";
import { SECTION_ORDER, cvSectionNotFound, cvVersionNotFound } from "./cv.queries";

interface SectionFields {
  title?: string;
  content?: string;
  sectionType?: SectionType;
}

/**
 * CV section CRUD and ordering. Every write also bumps the parent version's
 * updatedAt, so "recently edited" lists reflect section edits.
 */
@Injectable()
export class CvSectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSections(userId: string, versionId: string): Promise<CvSection[]> {
    const [version, sections] = await Promise.all([
      this.prisma.cvVersion.findFirst({
        where: { id: versionId, userId },
        select: { id: true },
      }),
      this.prisma.cvSection.findMany({
        where: { cvVersionId: versionId, cvVersion: { userId } },
        orderBy: SECTION_ORDER,
      }),
    ]);
    if (!version) throw cvVersionNotFound();
    return sections;
  }

  /** Appends a section; at most CV_LIMITS.maxSectionsPerVersion per version. */
  async createSection(
    userId: string,
    versionId: string,
    fields: SectionFields & { title: string },
  ): Promise<CvSection> {
    return lockedTransaction(this.prisma, userLockKey("cv", userId), async (tx) => {
      const touched = await tx.cvVersion.updateMany({
        where: { id: versionId, userId },
        data: { updatedAt: new Date() },
      });
      if (touched.count === 0) throw cvVersionNotFound();

      const stats = await tx.cvSection.aggregate({
        where: { cvVersionId: versionId },
        _count: { _all: true },
        _max: { order: true },
      });
      if (stats._count._all >= CV_LIMITS.maxSectionsPerVersion) {
        throw new BadRequestException(
          `A CV can have up to ${CV_LIMITS.maxSectionsPerVersion} sections.`,
        );
      }
      return tx.cvSection.create({
        data: {
          cvVersionId: versionId,
          title: fields.title,
          content: fields.content ?? "",
          sectionType: fields.sectionType ?? "custom",
          order: (stats._max.order ?? -1) + 1,
        },
      });
    });
  }

  async updateSection(
    userId: string,
    sectionId: string,
    fields: SectionFields,
  ): Promise<CvSection> {
    await this.findOwnedSection(userId, sectionId);
    return this.prisma.cvSection.update({
      where: { id: sectionId },
      data: {
        ...(fields.title !== undefined && { title: fields.title }),
        ...(fields.content !== undefined && { content: fields.content }),
        ...(fields.sectionType !== undefined && { sectionType: fields.sectionType }),
        cvVersion: { update: { updatedAt: new Date() } },
      },
    });
  }

  async deleteSection(userId: string, sectionId: string): Promise<void> {
    const { cvVersionId } = await this.findOwnedSection(userId, sectionId);
    await this.prisma.$transaction([
      this.prisma.cvSection.delete({ where: { id: sectionId } }),
      this.touchVersion(cvVersionId),
    ]);
  }

  /** Swaps a section with its neighbour; returns the full ordered list. */
  async moveSection(
    userId: string,
    sectionId: string,
    direction: "up" | "down",
  ): Promise<CvSection[]> {
    const { cvVersionId } = await this.findOwnedSection(userId, sectionId);
    const sections = await this.prisma.cvSection.findMany({
      where: { cvVersionId },
      orderBy: SECTION_ORDER,
    });
    const ids = sections.map((s) => s.id);
    const from = ids.indexOf(sectionId);
    const to = direction === "up" ? from - 1 : from + 1;
    if (from === -1 || to < 0 || to >= ids.length) return sections;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    return this.writeOrder(cvVersionId, sections, ids);
  }

  /** `sectionIds` must name every section of the version exactly once. */
  async reorderSections(
    userId: string,
    versionId: string,
    sectionIds: string[],
  ): Promise<CvSection[]> {
    const sections = await this.getSections(userId, versionId);
    const known = new Set(sections.map((s) => s.id));
    const isFullPermutation =
      sectionIds.length === sections.length &&
      new Set(sectionIds).size === sectionIds.length &&
      sectionIds.every((id) => known.has(id));
    if (!isFullPermutation) {
      throw new BadRequestException(
        "sectionIds must list every section of this CV exactly once.",
      );
    }
    return this.writeOrder(versionId, sections, sectionIds);
  }

  /**
   * Sets order = position for the rows whose order changes (also normalising
   * gaps and ties left by older data) in one transaction.
   */
  private async writeOrder(
    versionId: string,
    sections: CvSection[],
    orderedIds: string[],
  ): Promise<CvSection[]> {
    const byId = new Map(sections.map((s) => [s.id, s]));
    const changes = orderedIds
      .map((id, order) => ({ id, order }))
      .filter(({ id, order }) => byId.get(id)?.order !== order);

    if (changes.length > 0) {
      const updated = await this.prisma.$transaction(async (tx) => {
        const rows: CvSection[] = [];
        for (const { id, order } of changes) {
          rows.push(await tx.cvSection.update({ where: { id }, data: { order } }));
        }
        await tx.cvVersion.update({
          where: { id: versionId },
          data: { updatedAt: new Date() },
          select: { id: true },
        });
        return rows;
      });
      for (const row of updated) byId.set(row.id, row);
    }
    return orderedIds.map((id) => byId.get(id) as CvSection);
  }

  private async findOwnedSection(userId: string, sectionId: string) {
    const section = await this.prisma.cvSection.findFirst({
      where: { id: sectionId, cvVersion: { userId } },
      select: { cvVersionId: true },
    });
    if (!section) throw cvSectionNotFound();
    return section;
  }

  private touchVersion(id: string) {
    return this.prisma.cvVersion.update({
      where: { id },
      data: { updatedAt: new Date() },
      select: { id: true },
    });
  }
}
