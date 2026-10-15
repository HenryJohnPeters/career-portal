import { isAbortError, isApiError } from "@careerportal/web/data-access";

/*
 * Single sink for unexpected client errors (render crashes, failed requests
 * that are not the user's fault, uncaught exceptions). It always logs to the
 * console. When the build sets VITE_ERROR_REPORT_URL, each distinct error is
 * also sent there as a small JSON report (navigator.sendBeacon, text/plain so
 * no CORS preflight is needed): at most a few per page, without query strings
 * or user content. That URL's origin must be allowed by the site's CSP
 * `connect-src` (server.js allows the API origin, so an API route is simplest).
 */

const REPORT_URL = import.meta.env.VITE_ERROR_REPORT_URL?.trim() || null;
const MAX_REPORTS_PER_PAGE = 10;
const MAX_MESSAGE_LENGTH = 500;
const MAX_STACK_LENGTH = 4000;
const MAX_CONTEXT_LENGTH = 2000;

export interface ErrorReport {
  name: string;
  message: string;
  stack: string | null;
  /** JSON of the caller's context (query key, boundary, component stack), truncated. */
  context: string | null;
  /** Path only: query strings can carry ids and tokens. */
  path: string;
  release: string | null;
  environment: string;
  userAgent: string;
  timestamp: string;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function safeJson(value: unknown): string | null {
  try {
    const json = JSON.stringify(value);
    return json && json !== "{}" ? truncate(json, MAX_CONTEXT_LENGTH) : null;
  } catch {
    return null;
  }
}

export function buildErrorReport(
  error: unknown,
  context: Record<string, unknown>,
  env: { path: string; release: string | null; environment: string; userAgent: string; now: Date },
): ErrorReport {
  const err = error instanceof Error ? error : null;
  return {
    name: err?.name ?? typeof error,
    message: truncate(err?.message ?? String(error), MAX_MESSAGE_LENGTH),
    stack: err?.stack ? truncate(err.stack, MAX_STACK_LENGTH) : null,
    context: safeJson(context),
    path: env.path,
    release: env.release,
    environment: env.environment,
    userAgent: env.userAgent,
    timestamp: env.now.toISOString(),
  };
}

const sent = new Set<string>();

function send(report: ErrorReport): void {
  if (!REPORT_URL || sent.size >= MAX_REPORTS_PER_PAGE) return;
  const key = `${report.name}|${report.message}|${report.stack?.slice(0, 300) ?? ""}`;
  if (sent.has(key)) return;
  sent.add(key);
  try {
    const body = new Blob([JSON.stringify(report)], { type: "text/plain;charset=UTF-8" });
    if (navigator.sendBeacon?.(REPORT_URL, body)) return;
    void fetch(REPORT_URL, { method: "POST", body, keepalive: true, credentials: "omit" }).catch(() => undefined);
  } catch {
    // Reporting must never throw into the app.
  }
}

export function reportError(
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  console.error("[careerRepo] unexpected error", error, context);
  if (!REPORT_URL) return;
  send(
    buildErrorReport(error, context, {
      path: window.location.pathname,
      release: import.meta.env.VITE_RELEASE?.trim() || null,
      environment: import.meta.env.MODE,
      userAgent: navigator.userAgent,
      now: new Date(),
    }),
  );
}

/** Expected failures (cancelled requests, 4xx answers) are not reported. */
function isExpected(reason: unknown): boolean {
  return isAbortError(reason) || (isApiError(reason) && reason.status >= 400 && reason.status < 500);
}

/** Reports uncaught exceptions and unhandled promise rejections. Call once at startup. */
export function installGlobalErrorReporting(): void {
  window.addEventListener("error", (event) => {
    // Resource load errors (img, script) have no `error`; chunk errors recover by reloading.
    if (event.error) reportError(event.error, { source: "window.onerror" });
  });
  window.addEventListener("unhandledrejection", (event) => {
    if (!isExpected(event.reason)) reportError(event.reason, { source: "unhandledrejection" });
  });
}
