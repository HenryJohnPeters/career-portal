import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { ServiceUnavailableException } from "@nestjs/common";
import type { Browser } from "playwright";
import {
  PDF_ERROR_MESSAGES,
  PDF_RENDER_LIMITS,
  PdfRenderer,
  isAllowedRenderRequest,
  type PdfRenderLimits,
} from "./pdf-renderer";

const never = () => new Promise<never>(() => undefined);

interface FakeOptions {
  setContent?: () => Promise<unknown>;
  pdf?: () => Promise<Buffer>;
  closeContext?: () => Promise<void>;
}

/** Minimal stand-in for a Playwright browser, recording what the renderer does. */
class FakeBrowser {
  connected = true;
  closed = false;
  contexts: { options: unknown; closed: boolean }[] = [];
  routeHandler: ((route: unknown) => Promise<unknown>) | null = null;
  private onDisconnect: (() => void) | null = null;

  constructor(private readonly opts: FakeOptions = {}) {}

  isConnected() {
    return this.connected;
  }
  on(_event: "disconnected", cb: () => void) {
    this.onDisconnect = cb;
  }
  crash() {
    this.connected = false;
    this.onDisconnect?.();
  }
  async close() {
    this.closed = true;
    this.connected = false;
  }
  async newContext(options: unknown) {
    const record = { options, closed: false };
    this.contexts.push(record);
    return {
      route: async (_pattern: string, handler: (route: unknown) => Promise<unknown>) => {
        this.routeHandler = handler;
      },
      newPage: async () => ({
        setContent: this.opts.setContent ?? (async () => undefined),
        pdf: this.opts.pdf ?? (async () => Buffer.from("%PDF-1.7")),
      }),
      close: async () => {
        await (this.opts.closeContext?.() ?? Promise.resolve());
        record.closed = true;
      },
    };
  }
}

class TestRenderer extends PdfRenderer {
  launches = 0;
  constructor(
    private readonly browsers: (() => FakeBrowser | Promise<FakeBrowser>)[],
    limits: Partial<PdfRenderLimits> = {},
  ) {
    super({ ...PDF_RENDER_LIMITS, renderTimeoutMs: 100, closeTimeoutMs: 50, ...limits });
  }
  protected override async launch(): Promise<Browser> {
    const next = this.browsers[Math.min(this.launches, this.browsers.length - 1)];
    this.launches++;
    return (await next()) as unknown as Browser;
  }
}

async function rejectsWith(promise: Promise<unknown>, message: string) {
  await assert.rejects(promise, (err: unknown) => {
    assert.ok(err instanceof ServiceUnavailableException);
    assert.equal(err.message, message);
    return true;
  });
}

describe("isAllowedRenderRequest", () => {
  test("allows only data: URIs and Google Fonts", () => {
    assert.equal(isAllowedRenderRequest("data:image/png;base64,AA"), true);
    assert.equal(isAllowedRenderRequest("https://fonts.googleapis.com/css2?family=Inter"), true);
    assert.equal(isAllowedRenderRequest("https://fonts.gstatic.com/s/inter.woff2"), true);
    for (const url of [
      "http://169.254.169.254/latest/meta-data/",
      "https://fonts.googleapis.com.evil.com/x",
      "http://fonts.googleapis.com/css2",
      "https://example.com/photo.png",
      "file:///etc/passwd",
    ]) {
      assert.equal(isAllowedRenderRequest(url), false, url);
    }
  });
});

describe("PdfRenderer", () => {
  test("renders in a JS-disabled context that blocks non-font requests", async () => {
    const browser = new FakeBrowser();
    const renderer = new TestRenderer([() => browser]);
    const pdf = await renderer.render("<p>hi</p>");
    assert.equal(pdf.toString(), "%PDF-1.7");
    assert.equal(browser.contexts.length, 1);
    assert.deepEqual(browser.contexts[0].options, {
      javaScriptEnabled: false,
      serviceWorkers: "block",
      acceptDownloads: false,
    });
    assert.equal(browser.contexts[0].closed, true);

    const calls: string[] = [];
    const route = (url: string) => ({
      request: () => ({ url: () => url }),
      continue: async () => calls.push(`continue ${url}`),
      abort: async () => calls.push(`abort ${url}`),
    });
    await browser.routeHandler?.(route("https://fonts.gstatic.com/a.woff2"));
    await browser.routeHandler?.(route("http://10.0.0.1/"));
    assert.deepEqual(calls, ["continue https://fonts.gstatic.com/a.woff2", "abort http://10.0.0.1/"]);
  });

  test("a hung render hits the deadline, frees its slot and closes the context", async () => {
    let hang = true;
    const browser = new FakeBrowser({
      pdf: () => (hang ? never() : Promise.resolve(Buffer.from("ok"))),
    });
    const renderer = new TestRenderer([() => browser], { concurrency: 1 });
    await rejectsWith(renderer.render("x"), PDF_ERROR_MESSAGES.timeout);
    assert.equal(browser.contexts[0].closed, true);
    hang = false;
    assert.equal((await renderer.render("x")).toString(), "ok");
    assert.equal(renderer.launches, 1);
  });

  test("a context that cannot close gets the browser discarded and relaunched", async () => {
    const wedged = new FakeBrowser({ pdf: never, closeContext: never });
    const fresh = new FakeBrowser();
    const renderer = new TestRenderer([() => wedged, () => fresh]);
    await rejectsWith(renderer.render("x"), PDF_ERROR_MESSAGES.timeout);
    assert.equal(wedged.closed, true);
    await renderer.render("x");
    assert.equal(renderer.launches, 2);
  });

  test("relaunches after the browser crashes", async () => {
    const first = new FakeBrowser();
    const second = new FakeBrowser();
    const renderer = new TestRenderer([() => first, () => second]);
    await renderer.render("x");
    first.crash();
    await renderer.render("x");
    assert.equal(renderer.launches, 2);
    assert.equal(second.contexts.length, 1);
  });

  test("a failed launch is a 503 and is retried next time", async () => {
    const renderer = new TestRenderer([
      () => Promise.reject(new Error("Executable doesn't exist at /secret/path")),
      () => new FakeBrowser(),
    ]);
    await rejectsWith(renderer.render("x"), PDF_ERROR_MESSAGES.unavailable);
    await renderer.render("x");
    assert.equal(renderer.launches, 2);
  });

  test("slow fonts do not fail the PDF", async () => {
    const timeout = Object.assign(new Error("Timeout 10000ms exceeded."), { name: "TimeoutError" });
    const renderer = new TestRenderer([
      () => new FakeBrowser({ setContent: () => Promise.reject(timeout) }),
    ]);
    assert.equal((await renderer.render("x")).toString(), "%PDF-1.7");
  });

  test("rejects with 503 busy when the queue is full", async () => {
    let release: () => void = () => undefined;
    const browser = new FakeBrowser({
      pdf: () =>
        new Promise<Buffer>((resolve) => {
          release = () => resolve(Buffer.from("done"));
        }),
    });
    const renderer = new TestRenderer([() => browser], {
      concurrency: 1,
      maxQueue: 0,
      renderTimeoutMs: 5_000,
    });
    const first = renderer.render("a");
    await new Promise((resolve) => setImmediate(resolve));
    await rejectsWith(renderer.render("b"), PDF_ERROR_MESSAGES.busy);
    await new Promise((resolve) => setImmediate(resolve));
    release();
    assert.equal((await first).toString(), "done");
  });
});
