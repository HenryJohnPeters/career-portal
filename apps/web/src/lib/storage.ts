/*
 * Web Storage access that never throws. Browsers with site data blocked
 * (Safari "Block all cookies", some enterprise policies) throw a
 * SecurityError on access; callers treat that the same as "nothing stored".
 */

type StorageKind = "local" | "session";

function getStorage(kind: StorageKind): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readStorage(key: string, kind: StorageKind = "local"): string | null {
  try {
    return getStorage(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Returns false when the value could not be stored (blocked or full). */
export function writeStorage(key: string, value: string, kind: StorageKind = "local"): boolean {
  try {
    const storage = getStorage(kind);
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string, kind: StorageKind = "local"): void {
  try {
    getStorage(kind)?.removeItem(key);
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}

/** Removes every key starting with `prefix` (e.g. per-user drafts on sign-out). */
export function removeStorageByPrefix(prefix: string, kind: StorageKind = "local"): void {
  try {
    const storage = getStorage(kind);
    if (!storage) return;
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(prefix)) keys.push(key);
    }
    for (const key of keys) storage.removeItem(key);
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}
