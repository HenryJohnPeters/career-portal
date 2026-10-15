import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  Optional,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { Browser, BrowserContext } from "playwright";
import { Semaphore, SemaphoreRejectedError } from "./semaphore";

/** Renderer limits. Worst case per request: queue wait + render deadline (< web's 90s PDF timeout). */
export const PDF_RENDER_LIMITS = {
  concurrency: 2,
  maxQueue: 10,
  queueWaitMs: 20_000,
  /** Hard deadline for one render (context → content → pdf). */
  renderTimeoutMs: 30_000,
  /** Fonts get this long to load; after that the page prints with fallback fonts. */
  contentTimeoutMs: 15_000,
  closeTimeoutMs: 5_000,
};

export type PdfRenderLimits = typeof PDF_RENDER_LIMITS;

/** Optional DI override for the limits (specs construct the class directly). */
export const PDF_RENDER_LIMITS_TOKEN = Symbol("PDF_RENDER_LIMITS");

/** Only fonts may be fetched while rendering; the HTML inlines everything else. */
const ALLOWED_REQUEST = /^(data:|https:\/\/fonts\.(googleapis|gstatic)\.com\/)/i;

export function isAllowedRenderRequest(url: string): boolean {
  return ALLOWED_REQUEST.test(url);
}

export const PDF_ERROR_MESSAGES = {
  busy: "PDF service busy, please retry",
  timeout: "PDF generation timed out. Please try again.",
  unavailable: "PDF generation is temporarily unavailable. Please try again shortly.",
} as const;

class RenderDeadlineError extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message.split("\n")[0] : String(err);
}

/**
 * Turns self-contained HTML into a PDF with headless Chromium. Each render gets
 * a fresh context with JavaScript disabled and every request blocked except
 * Google Fonts, runs under a hard deadline, and holds one of a few semaphore
 * slots (bounded queue → 503 when full). A crashed or wedged browser is
 * discarded and relaunched by the next render.
 */
@Injectable()
export class PdfRenderer implements OnModuleDestroy {
  private readonly logger = new Logger(PdfRenderer.name);
  private readonly limits: PdfRenderLimits;
  private readonly slots: Semaphore;
  private browser: Browser | null = null;
  private launching: Promise<Browser> | null = null;

  constructor(
    @Optional() @Inject(PDF_RENDER_LIMITS_TOKEN) limits?: PdfRenderLimits,
  ) {
    this.limits = limits ?? PDF_RENDER_LIMITS;
    this.slots = new Semaphore(
      this.limits.concurrency,
      this.limits.maxQueue,
      this.limits.queueWaitMs,
    );
  }

  async onModuleDestroy(): Promise<void> {
    const browser = this.browser;
    this.browser = null;
    if (browser) await browser.close().catch(() => undefined);
  }

  /** Renders HTML to an A4 PDF. Throws 503 when busy, timed out or unavailable. */
  async render(html: string): Promise<Buffer> {
    try {
      await this.slots.acquire();
    } catch (err) {
      if (err instanceof SemaphoreRejectedError) {
        throw new ServiceUnavailableException(PDF_ERROR_MESSAGES.busy);
      }
      throw err;
    }
    try {
      return await this.renderWithDeadline(html);
    } finally {
      this.slots.release();
    }
  }

  /** Launches Chromium; specs override it with a fake browser. */
  protected async launch(): Promise<Browser> {
    const { chromium } = await import("playwright");
    return chromium.launch({
      headless: true,
      args: ["--disable-dev-shm-usage", "--disable-gpu"],
    });
  }

  private async renderWithDeadline(html: string): Promise<Buffer> {
    let browser: Browser;
    try {
      browser = await this.getBrowser();
    } catch (err) {
      this.logger.error(`Chromium launch failed: ${errorText(err)}`);
      throw new ServiceUnavailableException(PDF_ERROR_MESSAGES.unavailable);
    }

    const state: { context: BrowserContext | null } = { context: null };
    const work = (async () => {
      state.context = await browser.newContext({
        javaScriptEnabled: false,
        serviceWorkers: "block",
        acceptDownloads: false,
      });
      return this.renderInContext(state.context, html);
    })();

    let timer: NodeJS.Timeout | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new RenderDeadlineError()),
        this.limits.renderTimeoutMs,
      );
    });

    let timedOut = false;
    try {
      return await Promise.race([work, deadline]);
    } catch (err) {
      if (err instanceof RenderDeadlineError) {
        timedOut = true;
        this.logger.warn("PDF render exceeded its deadline");
        throw new ServiceUnavailableException(PDF_ERROR_MESSAGES.timeout);
      }
      this.logger.error(`PDF render failed: ${errorText(err)}`);
      throw new ServiceUnavailableException(PDF_ERROR_MESSAGES.unavailable);
    } finally {
      clearTimeout(timer);
      await this.cleanup(browser, state.context, timedOut);
    }
  }

  private async renderInContext(
    context: BrowserContext,
    html: string,
  ): Promise<Buffer> {
    await context.route("**/*", (route) =>
      (isAllowedRenderRequest(route.request().url())
        ? route.continue()
        : route.abort("blockedbyclient")
      ).catch(() => undefined),
    );
    const page = await context.newPage();
    try {
      await page.setContent(html, {
        waitUntil: "load",
        timeout: this.limits.contentTimeoutMs,
      });
    } catch (err) {
      // Slow fonts must not fail the PDF: the content is already in the page.
      if (!(err instanceof Error && err.name === "TimeoutError")) throw err;
      this.logger.warn("PDF content load timed out; printing with fallback fonts");
    }
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });
    return Buffer.from(pdf);
  }

  /** Closes the render's context; a browser that cannot do so is discarded. */
  private async cleanup(
    browser: Browser,
    context: BrowserContext | null,
    timedOut: boolean,
  ): Promise<void> {
    const closed = context
      ? await withTimeout(
          context.close().then(
            () => true,
            () => false,
          ),
          this.limits.closeTimeoutMs,
          false,
        )
      : !timedOut; // still opening at the deadline → the browser is wedged
    if (!closed || !browser.isConnected()) {
      this.logger.warn("Discarding the PDF browser after a failed render");
      if (this.browser === browser) this.browser = null;
      void browser.close().catch(() => undefined);
    }
  }

  private getBrowser(): Promise<Browser> {
    if (this.browser?.isConnected()) return Promise.resolve(this.browser);
    this.browser = null;
    if (!this.launching) {
      this.launching = this.launch()
        .then((browser) => {
          browser.on("disconnected", () => {
            if (this.browser === browser) this.browser = null;
          });
          this.browser = browser;
          return browser;
        })
        .finally(() => {
          this.launching = null;
        });
    }
    return this.launching;
  }
}
