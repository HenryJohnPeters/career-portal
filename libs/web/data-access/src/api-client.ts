import type {
  ApiErrorDetails,
  PremiumRequiredDetails,
  QuotaExceededDetails,
} from "@careerportal/shared/types";
import { hasDotSegment } from "./api-path";
import { supabase } from "./supabase";

const API_URL = resolveApiUrl();

function resolveApiUrl(): string {
  const configured = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (import.meta.env.DEV) return "http://localhost:3000";
  console.error("VITE_API_URL is not set — API requests will fail.");
  return "";
}

/** Default per-request timeout. */
export const DEFAULT_TIMEOUT_MS = 30_000;
/** AI calls and session/test creation: above the server's worst case (90s per AI call). */
export const AI_TIMEOUT_MS = 120_000;
/** PDF rendering (cold browser start on the server). */
export const PDF_TIMEOUT_MS = 90_000;

export interface RequestOptions {
  /** Abort after this many ms (default DEFAULT_TIMEOUT_MS). */
  timeoutMs?: number;
  /** Caller cancellation, e.g. React Query's `signal`. */
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export type ApiErrorKind = "http" | "timeout" | "network" | "parse";

/** Every failed API call rejects with this. `message` is always safe to show. */
export class ApiError extends Error {
  /** HTTP status; 0 when no response arrived (timeout / network). */
  readonly status: number;
  readonly details?: ApiErrorDetails;
  readonly kind: ApiErrorKind;
  /** From `details.retryAfterSeconds` or the Retry-After header (429s). */
  readonly retryAfterSeconds: number | null;

  constructor(
    message: string,
    init: {
      status: number;
      kind: ApiErrorKind;
      details?: ApiErrorDetails;
      retryAfterSeconds?: number | null;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = init.status;
    this.kind = init.kind;
    this.details = init.details;
    this.retryAfterSeconds = init.retryAfterSeconds ?? null;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function isQuotaError(
  err: unknown,
): err is ApiError & { details: QuotaExceededDetails } {
  return isApiError(err) && err.details?.reason === "quota_exceeded";
}

export function isPremiumRequiredError(
  err: unknown,
): err is ApiError & { details: PremiumRequiredDetails } {
  return isApiError(err) && err.details?.reason === "premium_required";
}

/** Quota or premium errors — the ones that should open the upgrade prompt. */
export function isUpgradeError(err: unknown): boolean {
  return isQuotaError(err) || isPremiumRequiredError(err);
}

/** 429: throttled, fair-use cap or cooldown. */
export function isRateLimitError(err: unknown): err is ApiError {
  return isApiError(err) && err.status === 429;
}

export function isAbortError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: unknown }).name === "AbortError"
  );
}

/** A user-presentable message for any thrown value. */
export function getErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (isApiError(err)) return err.message || fallback;
  if (isAbortError(err)) return fallback;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/**
 * React Query `retry` predicate: never retry client errors (4xx — quota,
 * validation, not found) or cancellations; retry other failures once.
 */
export function shouldRetryRequest(failureCount: number, err: unknown): boolean {
  if (isAbortError(err)) return false;
  if (isApiError(err) && err.status >= 400 && err.status < 500) return false;
  return failureCount < 1;
}

// === Error mapping ===

const KNOWN_REASONS = new Set<string>([
  "quota_exceeded",
  "premium_required",
  "fair_use_limit",
  "cooldown",
]);

function parseDetails(value: unknown): ApiErrorDetails | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const reason = (value as { reason?: unknown }).reason;
  if (typeof reason !== "string" || !KNOWN_REASONS.has(reason)) return undefined;
  return value as ApiErrorDetails;
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const date = Date.parse(header);
  if (Number.isNaN(date)) return null;
  return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "That request wasn't valid. Please check your input and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You don't have access to this.";
    case 404:
      return "We couldn't find that. It may have been deleted.";
    case 409:
      return "This was changed elsewhere. Please refresh and try again.";
    case 413:
      return "That's too large to save. Please shorten it and try again.";
    case 422:
      return "We couldn't process that request.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 502:
    case 503:
    case 504:
      return `The service is temporarily unavailable (${status}). Please try again shortly.`;
    default:
      return status >= 500
        ? `Something went wrong on our side (${status}). Please try again.`
        : `Request failed (${status}). Please try again.`;
  }
}

function isUsableMessage(message: string): boolean {
  return (
    message.length > 0 &&
    message.length <= 500 &&
    !/<\s*(!doctype|html|body|head)\b/i.test(message)
  );
}

async function toApiError(res: Response): Promise<ApiError> {
  const contentType = res.headers.get("content-type") ?? "";
  let message: string | null = null;
  let details: ApiErrorDetails | undefined;

  if (contentType.includes("application/json")) {
    const body = (await res.json().catch(() => null)) as {
      message?: unknown;
      details?: unknown;
    } | null;
    if (body && typeof body === "object") {
      const raw = body.message;
      if (typeof raw === "string") message = raw.trim();
      else if (Array.isArray(raw))
        message = raw.filter((m) => typeof m === "string").join(", ");
      details = parseDetails(body.details);
    }
  } else {
    // Proxy/HTML error pages are never shown to users.
    await res.body?.cancel().catch(() => undefined);
  }

  if (
    !message ||
    !isUsableMessage(message) ||
    (res.status >= 500 && /^internal server error$/i.test(message)) ||
    (res.status === 429 && /^ThrottlerException/i.test(message))
  ) {
    message = defaultMessageForStatus(res.status);
  }

  const retryAfterSeconds =
    details && "retryAfterSeconds" in details
      ? details.retryAfterSeconds
      : parseRetryAfter(res.headers.get("retry-after"));

  return new ApiError(message, {
    status: res.status,
    kind: "http",
    details,
    retryAfterSeconds,
  });
}

// === Auth: token, one-shot refresh, sign-out ===

const SIGN_OUT_REASON_KEY = "careerportal:signout-reason";

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

let refreshInFlight: Promise<string | null> | null = null;

/** Refresh the Supabase session once for all concurrent 401s; resolves to the new token. */
function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = supabase.auth
      .refreshSession()
      .then(({ data, error }) =>
        error ? null : (data.session?.access_token ?? null),
      )
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

let signOutInFlight: Promise<void> | null = null;

function signOutAfterAuthFailure(message: string): Promise<void> {
  if (!signOutInFlight) {
    try {
      sessionStorage.setItem(SIGN_OUT_REASON_KEY, message);
    } catch {
      // Storage unavailable (private mode) — the reason is only a hint.
    }
    signOutInFlight = supabase.auth
      .signOut({ scope: "local" })
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        signOutInFlight = null;
      });
  }
  return signOutInFlight;
}

/**
 * Why the client signed the user out after an unrecoverable 401 (e.g.
 * "Account is already linked to a different identity."). Returns it once.
 */
export function consumeSignOutReason(): string | null {
  try {
    const reason = sessionStorage.getItem(SIGN_OUT_REASON_KEY);
    if (reason) sessionStorage.removeItem(SIGN_OUT_REASON_KEY);
    return reason;
  } catch {
    return null;
  }
}

// === Transport ===

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function send<T>(
  method: Method,
  path: string,
  body: unknown,
  options: RequestOptions,
  read: (res: Response) => Promise<T>,
): Promise<T> {
  if (hasDotSegment(path)) {
    // Never let an id from a URL climb to another route (see api-path.ts).
    throw new ApiError("Not found.", { status: 404, kind: "http" });
  }
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let token = await getToken();

  for (let attempt = 0; ; attempt++) {
    const headers: Record<string, string> = { ...options.headers };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const onCallerAbort = () => controller.abort();
    if (options.signal?.aborted) controller.abort();
    else options.signal?.addEventListener("abort", onCallerAbort);

    try {
      let res: Response;
      try {
        res = await fetch(`${API_URL}${path}`, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (err) {
        throw transportError(err, timedOut, options.signal);
      }

      if (!res.ok) {
        const error = await toApiError(res);
        if (res.status === 401 && token) {
          if (attempt === 0) {
            // Another request may already have refreshed the session.
            const current = await getToken();
            const next =
              current && current !== token ? current : await refreshAccessToken();
            if (next) {
              token = next;
              continue;
            }
          }
          await signOutAfterAuthFailure(error.message);
        }
        throw error;
      }

      try {
        return await read(res);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw transportError(err, timedOut, options.signal);
      }
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onCallerAbort);
    }
  }
}

function transportError(
  err: unknown,
  timedOut: boolean,
  callerSignal: AbortSignal | undefined,
): unknown {
  if (timedOut) {
    return new ApiError(
      "The request timed out. Please check your connection and try again.",
      { status: 0, kind: "timeout" },
    );
  }
  // Caller cancellation is propagated untouched so React Query can ignore it.
  if (callerSignal?.aborted) return err;
  return new ApiError(
    "Couldn't reach the server. Please check your connection and try again.",
    { status: 0, kind: "network" },
  );
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("Unexpected response from the server. Please try again.", {
      status: res.status,
      kind: "parse",
    });
  }
}

const readText = (res: Response) => res.text();
const readBlob = (res: Response) => res.blob();

// === Downloads ===

export interface BlobWithFilename {
  blob: Blob;
  /** From Content-Disposition (RFC 5987 `filename*` preferred); null when absent. */
  filename: string | null;
}

function cleanFilename(value: string): string | null {
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]/g, "_")
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

/** Extract the filename from a Content-Disposition header. */
export function parseContentDispositionFilename(
  header: string | null,
): string | null {
  if (!header) return null;

  const extended = /filename\*\s*=\s*([^;]+)/i.exec(header);
  if (extended) {
    const value = extended[1].trim().replace(/^"(.*)"$/, "$1");
    const match = /^([^']*)'[^']*'(.*)$/.exec(value);
    const charset = match ? match[1].toLowerCase() : "utf-8";
    const encoded = match ? match[2] : value;
    if (charset === "utf-8" || charset === "") {
      try {
        const decoded = cleanFilename(decodeURIComponent(encoded));
        if (decoded) return decoded;
      } catch {
        // Malformed percent-encoding — fall back to the plain parameter.
      }
    }
  }

  const plain = /(?:^|;)\s*filename\s*=\s*(?:"((?:\\.|[^"\\])*)"|([^;]*))/i.exec(header);
  if (plain) {
    const value = plain[1] !== undefined ? plain[1].replace(/\\(.)/g, "$1") : plain[2];
    return cleanFilename(value ?? "");
  }
  return null;
}

/** Save a Blob as a file via a temporary object URL. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

// === Public client ===

export const api = {
  get: <T>(path: string, options: RequestOptions = {}) =>
    send<T>("GET", path, undefined, options, readJson),
  getText: (path: string, options: RequestOptions = {}) =>
    send("GET", path, undefined, options, readText),
  getBlob: (path: string, options: RequestOptions = {}) =>
    send("GET", path, undefined, options, readBlob),
  getBlobWithFilename: (
    path: string,
    options: RequestOptions = {},
  ): Promise<BlobWithFilename> =>
    send("GET", path, undefined, options, async (res) => ({
      blob: await res.blob(),
      filename: parseContentDispositionFilename(
        res.headers.get("content-disposition"),
      ),
    })),
  post: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    send<T>("POST", path, body, options, readJson),
  patch: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    send<T>("PATCH", path, body, options, readJson),
  put: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    send<T>("PUT", path, body, options, readJson),
  delete: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    send<T>("DELETE", path, body, options, readJson),
};
