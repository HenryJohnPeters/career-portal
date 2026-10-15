import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { readStorage, writeStorage } from "./storage";

/*
 * Route chunks are content-hashed. After a deploy, a tab that is still open
 * asks for chunk names that no longer exist; reloading once fetches the new
 * index.html and its chunks. The timestamp guard prevents a reload loop when
 * the failure is something else (offline, server down).
 */
const RELOAD_KEY = "careerportal:chunk-reload-at";
const RELOAD_GUARD_MS = 10_000;

const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS|ChunkLoadError/i;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return CHUNK_ERROR_PATTERN.test(message);
}

/** Reloads the page unless it already did so moments ago. Returns true when reloading. */
export function reloadForStaleChunks(): boolean {
  const last = Number(readStorage(RELOAD_KEY, "session") ?? 0);
  if (Date.now() - last < RELOAD_GUARD_MS) return false;
  if (!writeStorage(RELOAD_KEY, String(Date.now()), "session")) return false;
  window.location.reload();
  return true;
}

/**
 * React.lazy for a named export, with stale-chunk recovery:
 * `lazyPage(() => import("./pages/LoginPage").then((m) => m.LoginPage))`.
 */
// ComponentType<any> mirrors React.lazy's own constraint.
export function lazyPage<T extends ComponentType<any>>(
  load: () => Promise<T>,
): LazyExoticComponent<T> {
  return lazy(() =>
    load().then(
      (component) => ({ default: component }),
      (error: unknown) => {
        if (isChunkLoadError(error) && reloadForStaleChunks()) {
          // The page is reloading; never settle so no error UI flashes.
          return new Promise<never>(() => undefined);
        }
        throw error;
      },
    ),
  );
}

/** Vite fires this when a lazy chunk's preloaded dependencies fail to load. */
export function installChunkErrorRecovery(): void {
  window.addEventListener("vite:preloadError", (event) => {
    if (reloadForStaleChunks()) event.preventDefault();
  });
}
