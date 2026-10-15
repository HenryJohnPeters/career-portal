import { createHash } from "node:crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { FREE_TEMPLATE_IDS } from "../../common/constants";
import { CooldownException, PremiumRequiredException } from "../../common/errors";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { SECTION_ORDER } from "../cv/cv.queries";
import { renderCvHtml } from "./render-cv-html";
import { renderCoverLetterHtml } from "./templates/cover-letter";
import { DEFAULT_TEMPLATE_ID, isTemplateId } from "./templates/registry";
import type { CvData } from "./templates/shared";
import { LruCache } from "./lru-cache";
import { PdfRenderer } from "./pdf-renderer";
import { pdfFilename } from "./pdf-filename";
import { PhotoService } from "./photo.service";

export interface PdfDocument {
  buffer: Buffer;
  filename: string;
  cacheHit: boolean;
}

/** Contact + theme fields the CV and letterhead renders need. */
const CV_HEADER_SELECT = {
  title: true,
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
  user: { select: { name: true, email: true } },
} as const satisfies Prisma.CvVersionSelect;

type CvHeaderRow = Prisma.CvVersionGetPayload<{ select: typeof CV_HEADER_SELECT }>;

const CV_RENDER_SELECT = {
  ...CV_HEADER_SELECT,
  sections: {
    select: { title: true, content: true, order: true, sectionType: true },
    orderBy: SECTION_ORDER,
  },
} as const satisfies Prisma.CvVersionSelect;

type CvRenderRow = Prisma.CvVersionGetPayload<{ select: typeof CV_RENDER_SELECT }>;

const PDF_CACHE = {
  maxEntries: 100,
  maxBytes: 100 * 1024 * 1024,
  ttlMs: 10 * 60 * 1000,
} as const;

/** Seconds a user is asked to wait while another of their PDFs is rendering. */
const BUSY_RETRY_SECONDS = 3;

/**
 * Builds CV / cover-letter HTML from the user's own rows and turns it into
 * PDFs. PDFs are cached by the sha256 of the exact HTML, so any change to
 * sections, contact, theme, template or name produces a fresh render.
 */
@Injectable()
export class PdfService {
  private readonly cache = new LruCache<Buffer>({
    ...PDF_CACHE,
    sizeOf: (buffer) => buffer.length,
  });
  /** Renders in progress by HTML hash (a double-click shares one render). */
  private readonly inFlight = new Map<string, Promise<Buffer>>();
  /** Users with a render in progress (one at a time per user). */
  private readonly rendering = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly renderer: PdfRenderer,
    private readonly photos: PhotoService,
  ) {}

  /* ── CV ─────────────────────────────────────────────────────────── */

  async getCvHtml(userId: string, cvVersionId: string): Promise<string> {
    return this.renderCv(await this.loadCv(userId, cvVersionId));
  }

  async getCvPdf(userId: string, cvVersionId: string): Promise<PdfDocument> {
    const row = await this.loadCv(userId, cvVersionId);
    await this.assertTemplateAllowed(userId, row.templateId);
    const { buffer, cacheHit } = await this.toPdf(userId, await this.renderCv(row));
    return {
      buffer,
      cacheHit,
      filename: pdfFilename(row.name || row.user.name || row.title, "CV"),
    };
  }

  /* ── Cover letters ──────────────────────────────────────────────── */

  async getCoverLetterHtml(
    userId: string,
    coverLetterId: string,
    cvVersionId?: string,
  ): Promise<string> {
    const { html } = await this.buildCoverLetter(userId, coverLetterId, cvVersionId);
    return html;
  }

  async getCoverLetterPdf(
    userId: string,
    coverLetterId: string,
    cvVersionId?: string,
  ): Promise<PdfDocument> {
    const { html, senderName } = await this.buildCoverLetter(
      userId,
      coverLetterId,
      cvVersionId,
    );
    const { buffer, cacheHit } = await this.toPdf(userId, html);
    return { buffer, cacheHit, filename: pdfFilename(senderName, "Cover Letter") };
  }

  /* ── Internals ──────────────────────────────────────────────────── */

  private async loadCv(userId: string, cvVersionId: string): Promise<CvRenderRow> {
    const row = await this.prisma.cvVersion.findFirst({
      where: { id: cvVersionId, userId },
      select: CV_RENDER_SELECT,
    });
    if (!row) throw new NotFoundException("CV version not found");
    return row;
  }

  private async renderCv(row: CvRenderRow): Promise<string> {
    const data: CvData = {
      ...this.headerData(row),
      sections: row.sections,
      templateId: row.templateId,
      themeConfig: row.themeConfig,
      headerLayout: row.headerLayout,
      photoUrl: await this.photos.inline(row.photoUrl),
    };
    return renderCvHtml(data);
  }

  private async buildCoverLetter(
    userId: string,
    coverLetterId: string,
    cvVersionId?: string,
  ) {
    const [letter, cv] = await Promise.all([
      this.prisma.coverLetter.findFirst({
        where: { id: coverLetterId, userId },
        select: {
          title: true,
          body: true,
          job: { select: { company: true, role: true } },
          linkedFromJobs: {
            select: { company: true, role: true },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      }),
      this.findLetterheadCv(userId, cvVersionId),
    ]);
    if (!letter) throw new NotFoundException("Cover letter not found");

    const sender = cv
      ? this.headerData(cv)
      : await this.prisma.user
          .findUnique({ where: { id: userId }, select: { name: true, email: true } })
          .then((user) => ({ userName: user?.name, userEmail: user?.email }));

    const html = renderCoverLetterHtml({
      title: letter.title,
      body: letter.body,
      date: new Date(),
      recipient: letter.job ?? letter.linkedFromJobs[0] ?? null,
      sender,
      themeConfig: cv?.themeConfig,
    });
    return { html, senderName: sender.userName || letter.title };
  }

  /** The requested CV (must be the user's), else the active / latest one, else none. */
  private async findLetterheadCv(
    userId: string,
    cvVersionId?: string,
  ): Promise<CvHeaderRow | null> {
    if (cvVersionId) {
      const cv = await this.prisma.cvVersion.findFirst({
        where: { id: cvVersionId, userId },
        select: CV_HEADER_SELECT,
      });
      if (!cv) throw new NotFoundException("CV version not found");
      return cv;
    }
    return this.prisma.cvVersion.findFirst({
      where: { userId },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      select: CV_HEADER_SELECT,
    });
  }

  private headerData(row: CvHeaderRow) {
    return {
      title: row.title,
      userName: row.name || row.user.name,
      userEmail: row.email || row.user.email,
      phone: row.phone ?? undefined,
      location: row.location ?? undefined,
      website: row.website ?? undefined,
      linkedin: row.linkedin ?? undefined,
      github: row.github ?? undefined,
    };
  }

  /**
   * Premium templates stay previewable after premium lapses, but downloading
   * them needs Premium (switching to a free template always works).
   */
  private async assertTemplateAllowed(userId: string, templateId: string) {
    const effective = isTemplateId(templateId) ? templateId : DEFAULT_TEMPLATE_ID;
    if (FREE_TEMPLATE_IDS.includes(effective)) return;
    const plan = await this.entitlements.getPlan(userId);
    if (!plan.isPremium) {
      throw new PremiumRequiredException(
        "templates",
        "This CV uses a Premium template. Upgrade, or switch to a free template to download it.",
      );
    }
  }

  private async toPdf(
    userId: string,
    html: string,
  ): Promise<{ buffer: Buffer; cacheHit: boolean }> {
    const key = createHash("sha256").update(html).digest("hex");
    const cached = this.cache.get(key);
    if (cached) return { buffer: cached, cacheHit: true };

    const pending = this.inFlight.get(key);
    if (pending) return { buffer: await pending, cacheHit: false };

    if (this.rendering.has(userId)) {
      throw new CooldownException(
        BUSY_RETRY_SECONDS,
        "Your previous PDF is still being generated. Please try again in a moment.",
      );
    }
    this.rendering.add(userId);
    const render = this.renderer
      .render(html)
      .then((buffer) => {
        this.cache.set(key, buffer);
        return buffer;
      })
      .finally(() => {
        this.inFlight.delete(key);
        this.rendering.delete(userId);
      });
    this.inFlight.set(key, render);
    return { buffer: await render, cacheHit: false };
  }
}
