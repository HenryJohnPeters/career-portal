import { Injectable, NotFoundException, OnModuleDestroy } from "@nestjs/common";
import { CvService } from "../modules/cv/cv.service";
import { PrismaService } from "../common/prisma.service";
import { renderCvHtml } from "./render-cv-html";
import { Semaphore } from "./semaphore";

// Lazy-load playwright so the module boots even when browsers aren't installed.
// Only PDF generation needs it; the HTML preview works without it.
let _chromium: typeof import("playwright")["chromium"] | null = null;
async function getChromium() {
  if (!_chromium) {
    const pw = await import("playwright");
    _chromium = pw.chromium;
  }
  return _chromium;
}

type Browser = Awaited<ReturnType<typeof getChromium>> extends {
  launch: (...args: any[]) => Promise<infer B>;
}
  ? B
  : never;

interface CacheEntry {
  buffer: Buffer;
  contentVersion: string;
  createdAt: number;
}

interface CvVersionWithSections {
  id: string;
  title: string;
  updatedAt: Date;
  templateId: string | null;
  themeConfig: unknown;
  headerLayout: string | null;
  name: string | null;
  email: string | null;
  photoUrl: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  sections: {
    title: string;
    content: string;
    order: number;
    sectionType: string;
  }[];
  user: { name: string; email: string };
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class PdfService implements OnModuleDestroy {
  private browser: Browser | null = null;
  private browserPromise: Promise<Browser> | null = null;
  private readonly semaphore = new Semaphore(2);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    private readonly cvService: CvService,
    private readonly prisma: PrismaService
  ) {}

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.browserPromise = null;
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser?.isConnected()) return this.browser;
    if (!this.browserPromise) {
      this.browserPromise = getChromium()
        .then((ch) => ch.launch({ headless: true }))
        .then((b) => {
          this.browser = b;
          return b;
        })
        .catch((err) => {
          this.browserPromise = null;
          throw err;
        });
    }
    return this.browserPromise;
  }

  private async fetchCvVersion(
    cvVersionId: string
  ): Promise<CvVersionWithSections> {
    const version = await this.prisma.cvVersion.findUnique({
      where: { id: cvVersionId },
      include: {
        sections: { orderBy: { order: "asc" } },
        user: { select: { name: true, email: true } },
      },
    });
    if (!version) throw new NotFoundException("CV version not found");
    return version as unknown as CvVersionWithSections;
  }

  private buildRenderArgs(
    v: CvVersionWithSections
  ): Parameters<typeof renderCvHtml>[0] {
    return {
      title: v.title,
      sections: v.sections.map((s) => ({
        title: s.title,
        content: s.content,
        order: s.order,
        sectionType: s.sectionType,
      })),
      userName: v.name || v.user.name,
      userEmail: v.email || v.user.email,
      templateId: v.templateId ?? undefined,
      themeConfig: v.themeConfig as Record<string, unknown>,
      headerLayout: v.headerLayout ?? undefined,
      photoUrl: v.photoUrl ?? undefined,
      phone: v.phone ?? undefined,
      location: v.location ?? undefined,
      website: v.website ?? undefined,
      linkedin: v.linkedin ?? undefined,
      github: v.github ?? undefined,
    };
  }

  async generateCvHtml(cvVersionId: string): Promise<string> {
    const v = await this.fetchCvVersion(cvVersionId);
    return renderCvHtml(this.buildRenderArgs(v));
  }

  async generateCvPdf(
    cvVersionId: string
  ): Promise<{ buffer: Buffer; cacheHit: boolean }> {
    const v = await this.fetchCvVersion(cvVersionId);
    const contentVersion = v.updatedAt.toISOString();

    // Check cache
    const cached = this.cache.get(cvVersionId);
    if (
      cached &&
      cached.contentVersion === contentVersion &&
      Date.now() - cached.createdAt < CACHE_TTL_MS
    ) {
      return { buffer: cached.buffer, cacheHit: true };
    }

    const html = renderCvHtml(this.buildRenderArgs(v));

    // Generate PDF with concurrency limit
    await this.semaphore.acquire();
    let page;
    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      });

      const buffer = Buffer.from(pdfBuffer);

      this.cache.set(cvVersionId, {
        buffer,
        contentVersion,
        createdAt: Date.now(),
      });

      this.evictStaleEntries();

      return { buffer, cacheHit: false };
    } finally {
      await page?.close().catch(() => {});
      this.semaphore.release();
    }
  }

  private evictStaleEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.createdAt > CACHE_TTL_MS) {
        this.cache.delete(key);
      }
    }
  }
}
