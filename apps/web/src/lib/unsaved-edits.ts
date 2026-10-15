/*
 * Autosaving editors (CV sections, contact details, theme, cover letters)
 * register their flush here while mounted, so signing out can save pending
 * edits first: once the session has ended their requests would go out
 * without a token and the text would be lost.
 */

type Flush = () => Promise<boolean>;

const flushers = new Set<Flush>();
let leavingPage = false;

/** Returns the unregister function (call it on unmount). */
export function registerUnsavedEdits(flush: Flush): () => void {
  flushers.add(flush);
  return () => {
    flushers.delete(flush);
  };
}

/**
 * Saves every registered editor's pending edits. Resolves true when all of
 * them saved; false when any failed or `timeoutMs` passed first (sign-out
 * must not hang on a stuck request).
 */
export async function flushUnsavedEdits(timeoutMs = 3000): Promise<boolean> {
  if (flushers.size === 0) return true;
  const all = Promise.allSettled([...flushers].map((flush) => flush())).then((results) =>
    results.every((result) => result.status === "fulfilled" && result.value),
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });
  try {
    return await Promise.race([all, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Set while the app leaves the page on purpose (signing out): editors then
 * don't ask "Leave site?", which would strand the user on a half-signed-out page.
 */
export function setLeavingPage(value: boolean): void {
  leavingPage = value;
}

export function isLeavingPage(): boolean {
  return leavingPage;
}
