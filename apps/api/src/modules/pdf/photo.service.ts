import { Injectable, Logger } from "@nestjs/common";
import { LruCache } from "./lru-cache";
import { fetchPhotoAsDataUri, PhotoFetchError } from "./net/photo-fetcher";

const PHOTO_CACHE_TTL_MS = 10 * 60 * 1000;
/** Failed fetches are remembered briefly so a dead host doesn't slow every preview. */
const PHOTO_FAILURE_TTL_MS = 2 * 60 * 1000;

/**
 * Resolves a CV's stored photo URL to an inline `data:` URI (or nothing), so
 * neither the preview nor the PDF browser ever loads a remote image.
 */
@Injectable()
export class PhotoService {
  private readonly logger = new Logger(PhotoService.name);
  private readonly cache = new LruCache<string | null>({
    maxEntries: 50,
    maxBytes: 24 * 1024 * 1024,
    ttlMs: PHOTO_CACHE_TTL_MS,
    sizeOf: (uri) => (uri?.length ?? 0) + 64,
  });
  private readonly pending = new Map<string, Promise<string | null>>();

  /** The photo as a data URI, or undefined when there is none or it can't be used. */
  async inline(url: string | null | undefined): Promise<string | undefined> {
    if (!url) return undefined;
    const cached = this.cache.get(url);
    if (cached !== undefined) return cached ?? undefined;

    let pending = this.pending.get(url);
    if (!pending) {
      pending = fetchPhotoAsDataUri(url)
        .catch((err: unknown) => {
          const reason = err instanceof PhotoFetchError ? err.message : "fetch failed";
          this.logger.warn(`CV photo skipped: ${reason}`);
          return null;
        })
        .then((uri) => {
          this.cache.set(url, uri, uri ? PHOTO_CACHE_TTL_MS : PHOTO_FAILURE_TTL_MS);
          return uri;
        })
        .finally(() => this.pending.delete(url));
      this.pending.set(url, pending);
    }
    return (await pending) ?? undefined;
  }
}
