import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { DEFAULT_CV_SECTIONS, FREE_TEMPLATE_IDS } from "../../common/constants";
import { QuotaExceededException } from "../../common/errors";
import { lockedTransaction, userLockKey } from "../../common/plan";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { AiService } from "../ai/ai.service";
import type { AiCvAction, AiFullCvResult } from "../ai/ai.service";
import { normalizeThemeConfig } from "../pdf/templates/theme";
import { CV_LIMITS } from "./cv.rules";
import {
  buildSnapshot,
  CONTACT_FIELDS,
  parseSnapshot,
  pickContact,
  snapshotToJson,
  type CvContact,
  type SnapshotSection,
} from "./cv-snapshot";
import {
  CV_VERSION_SELECT,
  HAS_SNAPSHOT,
  SECTION_ORDER,
  cvSectionNotFound,
  cvVersionNotFound,
  toCvVersionPayload,
  type CvVersionPayload,
} from "./cv.queries";
import type {
  ApplyCvContentDto,
  CvContactDto,
  UpdateCvVersionDto,
} from "./cv.dto";

type Tx = Prisma.TransactionClient;

/** Contact select used for snapshots. */
const CONTACT_SELECT = Object.fromEntries(
  CONTACT_FIELDS.map((field) => [field, true]),
) as Record<(typeof CONTACT_FIELDS)[number], true>;

/** What an undo snapshot captures. */
const CONTENT_SELECT = {
  ...CONTACT_SELECT,
  sections: {
    select: { title: true, content: true, sectionType: true },
    orderBy: SECTION_ORDER,
  },
} satisfies Prisma.CvVersionSelect;

/** Keeps a generated title (e.g. "<title> (Copy)") within the title limit. */
function clampTitle(title: string): string {
  return Array.from(title).slice(0, CV_LIMITS.versionTitle).join("");
}

/** Only the contact fields the request actually set (undefined = unchanged). */
function contactUpdate(dto: CvContactDto | undefined): Partial<CvContact> {
  const update: Partial<CvContact> = {};
  if (!dto) return update;
  for (const field of CONTACT_FIELDS) {
    const value = dto[field];
    if (value !== undefined) update[field] = value;
  }
  return update;
}

@Injectable()
export class CvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly aiService: AiService,
  ) {}

  /* ── Versions ───────────────────────────────────────────────────── */

  async getVersions(userId: string): Promise<CvVersionPayload[]> {
    const [rows, withSnapshot] = await Promise.all([
      this.prisma.cvVersion.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: CV_VERSION_SELECT,
      }),
      this.prisma.cvVersion.findMany({
        where: { userId, ...HAS_SNAPSHOT },
        select: { id: true },
      }),
    ]);
    const snapshotIds = new Set(withSnapshot.map((v) => v.id));
    return rows.map((row) => toCvVersionPayload(row, snapshotIds.has(row.id)));
  }

  /** One version with its sections (404 unless it is the user's). */
  async getVersion(userId: string, id: string): Promise<CvVersionPayload> {
    const [row, hasSnapshot] = await Promise.all([
      this.prisma.cvVersion.findFirst({
        where: { id, userId },
        select: CV_VERSION_SELECT,
      }),
      this.hasSnapshot(id),
    ]);
    if (!row) throw cvVersionNotFound();
    return toCvVersionPayload(row, hasSnapshot);
  }

  async createVersion(userId: string, title: string): Promise<CvVersionPayload> {
    const limit = await this.versionLimit(userId);
    const row = await lockedTransaction(this.prisma, userLockKey("cv", userId), async (tx) => {
      await this.assertVersionQuota(tx, userId, limit);
      return tx.cvVersion.create({
        data: {
          userId,
          title,
          sections: {
            createMany: {
              data: DEFAULT_CV_SECTIONS.map((s, i) => ({
                title: s.title,
                sectionType: s.sectionType,
                content: "",
                order: i,
              })),
            },
          },
        },
        select: CV_VERSION_SELECT,
      });
    });
    return toCvVersionPayload(row, false);
  }

  async updateVersion(
    userId: string,
    id: string,
    dto: UpdateCvVersionDto,
  ): Promise<CvVersionPayload> {
    const current = await this.prisma.cvVersion.findFirst({
      where: { id, userId },
      select: { templateId: true, themeConfig: true },
    });
    if (!current) throw cvVersionNotFound();

    // Only a change of template is gated, so a version that kept a premium
    // template after premium lapsed can still be edited.
    if (
      dto.templateId !== undefined &&
      dto.templateId !== current.templateId &&
      !FREE_TEMPLATE_IDS.includes(dto.templateId)
    ) {
      await this.entitlements.assertPremium(userId, "templates");
    }

    const data: Prisma.CvVersionUpdateInput = {
      ...contactUpdate(dto),
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.templateId !== undefined && { templateId: dto.templateId }),
      ...(dto.headerLayout !== undefined && { headerLayout: dto.headerLayout }),
      ...(dto.themeConfig !== undefined && {
        themeConfig: {
          ...normalizeThemeConfig(dto.themeConfig, normalizeThemeConfig(current.themeConfig)),
        },
      }),
    };

    const update = this.prisma.cvVersion.update({
      where: { id },
      data,
      select: CV_VERSION_SELECT,
    });
    const [row, hasSnapshot] = await Promise.all([
      dto.isActive
        ? this.prisma
            .$transaction([
              this.prisma.cvVersion.updateMany({
                where: { userId, isActive: true, NOT: { id } },
                data: { isActive: false },
              }),
              update,
            ])
            .then(([, updated]) => updated)
        : update,
      this.hasSnapshot(id),
    ]);
    return toCvVersionPayload(row, hasSnapshot);
  }

  async deleteVersion(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.cvVersion.deleteMany({ where: { id, userId } });
    if (count === 0) throw cvVersionNotFound();
  }

  /**
   * Copies a version (theme, contact and sections; not the undo snapshot).
   * Counts toward the free CV-version limit.
   */
  async duplicateVersion(
    userId: string,
    id: string,
    options: { title?: string } = {},
  ): Promise<CvVersionPayload> {
    const limit = await this.versionLimit(userId);
    const row = await lockedTransaction(this.prisma, userLockKey("cv", userId), async (tx) => {
      const original = await tx.cvVersion.findFirst({
        where: { id, userId },
        select: {
          ...CONTACT_SELECT,
          title: true,
          templateId: true,
          themeConfig: true,
          headerLayout: true,
          sections: {
            select: { title: true, content: true, sectionType: true },
            orderBy: SECTION_ORDER,
          },
        },
      });
      if (!original) throw cvVersionNotFound();
      await this.assertVersionQuota(tx, userId, limit);

      const { sections, title, themeConfig, ...rest } = original;
      return tx.cvVersion.create({
        data: {
          ...rest,
          userId,
          title: clampTitle(options.title ?? `${title} (Copy)`),
          isActive: false,
          themeConfig: { ...normalizeThemeConfig(themeConfig) },
          sections: {
            createMany: {
              data: sections.map((section, order) => ({ ...section, order })),
            },
          },
        },
        select: CV_VERSION_SELECT,
      });
    });
    return toCvVersionPayload(row, false);
  }

  /* ── Bulk content + undo ────────────────────────────────────────── */

  /**
   * Replaces all sections (and the given contact fields) in one transaction.
   * The previous content becomes the version's undo snapshot.
   */
  async applyContent(
    userId: string,
    id: string,
    dto: ApplyCvContentDto,
  ): Promise<CvVersionPayload> {
    const row = await lockedTransaction(this.prisma, userLockKey("cv", userId), async (tx) => {
      const current = await tx.cvVersion.findFirst({
        where: { id, userId },
        select: CONTENT_SELECT,
      });
      if (!current) throw cvVersionNotFound();
      const snapshot = buildSnapshot(pickContact(current), current.sections);
      return this.replaceContent(tx, id, dto.sections, {
        contact: contactUpdate(dto.contact),
        lastSnapshot: snapshotToJson(snapshot),
      });
    });
    return toCvVersionPayload(row, true);
  }

  /** Swaps the current content with the undo snapshot (404 when there is none). */
  async restoreSnapshot(userId: string, id: string): Promise<CvVersionPayload> {
    const row = await lockedTransaction(this.prisma, userLockKey("cv", userId), async (tx) => {
      const current = await tx.cvVersion.findFirst({
        where: { id, userId },
        select: { ...CONTENT_SELECT, lastSnapshot: true },
      });
      if (!current) throw cvVersionNotFound();
      const previous = parseSnapshot(current.lastSnapshot);
      if (!previous) throw new NotFoundException("There is nothing to undo for this CV.");
      const snapshot = buildSnapshot(pickContact(current), current.sections);
      return this.replaceContent(tx, id, previous.sections, {
        contact: previous.contact,
        lastSnapshot: snapshotToJson(snapshot),
      });
    });
    return toCvVersionPayload(row, true);
  }

  /* ── AI ─────────────────────────────────────────────────────────── */

  /** AiService validates input and reserves usage itself; never wrap it in a reservation. */
  async aiGenerateSection(
    userId: string,
    sectionId: string,
    dto: {
      action: AiCvAction;
      jobTitle?: string;
      jobDescription?: string;
      currentContent?: string;
    },
  ): Promise<{ content: string; truncated: boolean }> {
    const section = await this.prisma.cvSection.findFirst({
      where: { id: sectionId, cvVersion: { userId } },
      select: { title: true, content: true, sectionType: true, cvVersionId: true },
    });
    if (!section) throw cvSectionNotFound();

    const otherSections = await this.prisma.cvSection.findMany({
      where: { cvVersionId: section.cvVersionId, NOT: { id: sectionId } },
      orderBy: SECTION_ORDER,
      select: { title: true, sectionType: true, content: true },
    });

    const result = await this.aiService.generateCvSectionContent(userId, {
      action: dto.action,
      sectionType: section.sectionType,
      sectionTitle: section.title,
      currentContent: dto.currentContent ?? section.content,
      jobTitle: dto.jobTitle,
      jobDescription: dto.jobDescription,
      allSections: otherSections,
    });
    return { content: result.content, truncated: result.truncated };
  }

  /** Generates a full CV from pasted text. Nothing is saved (see applyContent). */
  async aiGenerateFullCv(
    userId: string,
    versionId: string,
    dto: { rawText: string; jobTitle?: string; jobDescription?: string },
  ): Promise<AiFullCvResult & { truncated: boolean }> {
    const version = await this.prisma.cvVersion.findFirst({
      where: { id: versionId, userId },
      select: { name: true, user: { select: { name: true } } },
    });
    if (!version) throw cvVersionNotFound();

    return this.aiService.generateFullCvFromRawText(userId, {
      rawText: dto.rawText,
      jobTitle: dto.jobTitle,
      jobDescription: dto.jobDescription,
      userName: version.name || version.user.name || undefined,
    });
  }

  /* ── Internals ──────────────────────────────────────────────────── */

  private async hasSnapshot(id: string): Promise<boolean> {
    const count = await this.prisma.cvVersion.count({ where: { id, ...HAS_SNAPSHOT } });
    return count > 0;
  }

  /** Free-plan CV-version limit, or null when unlimited. */
  private async versionLimit(userId: string): Promise<number | null> {
    const plan = await this.entitlements.getPlan(userId);
    return plan.limits.cvVersions;
  }

  /** Call inside the per-user "cv" lock so concurrent creates can't overshoot. */
  private async assertVersionQuota(
    tx: Tx,
    userId: string,
    limit: number | null,
  ): Promise<void> {
    if (limit === null) return;
    const used = await tx.cvVersion.count({ where: { userId } });
    if (used >= limit) {
      throw new QuotaExceededException("cvVersions", limit, used, null);
    }
  }

  private async replaceContent(
    tx: Tx,
    id: string,
    sections: readonly Pick<SnapshotSection, "title" | "content" | "sectionType">[],
    update: { contact: Partial<CvContact>; lastSnapshot: Prisma.InputJsonObject },
  ) {
    await tx.cvSection.deleteMany({ where: { cvVersionId: id } });
    await tx.cvSection.createMany({
      data: sections.map((s, order) => ({
        cvVersionId: id,
        title: s.title,
        content: s.content,
        sectionType: s.sectionType,
        order,
      })),
    });
    return tx.cvVersion.update({
      where: { id },
      data: { ...update.contact, lastSnapshot: update.lastSnapshot },
      select: CV_VERSION_SELECT,
    });
  }
}
