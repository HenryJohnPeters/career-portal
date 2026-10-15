import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { request, type RequestOptions } from "node:https";
import { isIP, type LookupFunction } from "node:net";
import { isPublicIp } from "./ip-guard";

/*
 * Server-side fetch of a CV photo, so the PDF browser never loads remote
 * images. https only, default port, public IPs only (checked on the address
 * actually connected to, which also defeats DNS rebinding), bounded time and
 * size, and the bytes must really be a JPEG/PNG/WebP/GIF. The result is an
 * inline `data:` URI.
 */

export const PHOTO_FETCH_LIMITS = {
  maxBytes: 2 * 1024 * 1024,
  timeoutMs: 5_000,
  maxRedirects: 3,
} as const;

export type PhotoFetchLimits = typeof PHOTO_FETCH_LIMITS;

export class PhotoFetchError extends Error {}

const ALLOWED_CONTENT_TYPE = /^image\/(jpeg|jpg|pjpeg|png|webp|gif)\s*(;|$)/i;
const BLOCKED_HOSTNAME = /(^|\.)(localhost|local|internal|localdomain|home\.arpa)$/i;

/** DNS lookup that only ever resolves to public addresses. */
export const publicOnlyLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "");
    const list = addresses as LookupAddress[];
    if (list.length === 0 || list.some((a) => !isPublicIp(a.address))) {
      const blocked: NodeJS.ErrnoException = new Error(
        "Address is not publicly routable",
      );
      blocked.code = "EADDRNOTPUBLIC";
      return callback(blocked, "");
    }
    if (options.all) return callback(null, list);
    return callback(null, list[0].address, list[0].family);
  });
};

/** Validates a photo URL before any network access. Throws PhotoFetchError. */
export function parsePhotoUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new PhotoFetchError("invalid url");
  }
  if (url.protocol !== "https:") throw new PhotoFetchError("https only");
  if (url.username || url.password) throw new PhotoFetchError("credentials in url");
  if (url.port && url.port !== "443") throw new PhotoFetchError("non-default port");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host || BLOCKED_HOSTNAME.test(host)) throw new PhotoFetchError("blocked host");
  // IP literals skip DNS, so check them here.
  if (isIP(host) && !isPublicIp(host)) throw new PhotoFetchError("blocked address");
  return url;
}

/** Image type from the file's magic bytes (never trusts the header alone). */
export function sniffImageType(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }
  const head = bytes.subarray(0, 12).toString("latin1");
  if (head.startsWith("GIF87a") || head.startsWith("GIF89a")) return "image/gif";
  if (head.startsWith("RIFF") && head.slice(8, 12) === "WEBP") return "image/webp";
  return null;
}

type FetchOutcome =
  | { kind: "redirect"; location: string }
  | { kind: "image"; body: Buffer };

function fetchOnce(
  url: URL,
  deadline: number,
  limits: PhotoFetchLimits,
): Promise<FetchOutcome> {
  return new Promise((resolve, reject) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return reject(new PhotoFetchError("timeout"));

    let settled = false;
    const finish = (err: Error | null, outcome?: FetchOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Always drop the connection: once settled nothing more is read (a
      // redirect body could otherwise stream forever with no deadline).
      req.destroy();
      if (err) {
        // Network errors are reported by code only (messages can echo the host).
        const code = (err as NodeJS.ErrnoException).code ?? "network error";
        reject(err instanceof PhotoFetchError ? err : new PhotoFetchError(code));
      } else {
        resolve(outcome as FetchOutcome);
      }
    };

    const options: RequestOptions = {
      method: "GET",
      lookup: publicOnlyLookup,
      agent: false,
      headers: {
        accept: "image/jpeg,image/png,image/webp,image/gif",
        "user-agent": "CareerPortal-PDF/1.0",
      },
    };
    const req = request(url, options, (res) => {
      const status = res.statusCode ?? 0;
      if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
        return finish(null, { kind: "redirect", location: res.headers.location });
      }
      if (status !== 200) return finish(new PhotoFetchError(`status ${status}`));
      if (!ALLOWED_CONTENT_TYPE.test(res.headers["content-type"] ?? "")) {
        return finish(new PhotoFetchError("not an allowed image type"));
      }
      if (Number(res.headers["content-length"] ?? 0) > limits.maxBytes) {
        return finish(new PhotoFetchError("too large"));
      }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > limits.maxBytes) return finish(new PhotoFetchError("too large"));
        chunks.push(chunk);
      });
      res.on("end", () => finish(null, { kind: "image", body: Buffer.concat(chunks) }));
      res.on("error", (err) => finish(err));
    });
    const timer = setTimeout(() => finish(new PhotoFetchError("timeout")), remaining);
    req.on("error", (err) => finish(err));
    req.end();
  });
}

/**
 * Fetch an https image and return it as a `data:` URI. Throws PhotoFetchError
 * on any failure (callers skip the photo).
 */
export async function fetchPhotoAsDataUri(
  rawUrl: string,
  limits: PhotoFetchLimits = PHOTO_FETCH_LIMITS,
): Promise<string> {
  const deadline = Date.now() + limits.timeoutMs;
  let url = parsePhotoUrl(rawUrl);
  for (let redirects = 0; ; redirects++) {
    const outcome = await fetchOnce(url, deadline, limits);
    if (outcome.kind === "image") {
      const type = sniffImageType(outcome.body);
      if (!type) throw new PhotoFetchError("not an image");
      return `data:${type};base64,${outcome.body.toString("base64")}`;
    }
    if (redirects >= limits.maxRedirects) throw new PhotoFetchError("too many redirects");
    url = parsePhotoUrl(new URL(outcome.location, url).toString());
  }
}
