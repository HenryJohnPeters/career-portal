import { useCallback, useEffect, useRef, useState } from "react";
import { canWritePrivateDraft, privateDraftOwner } from "../../../lib/private-drafts";
import { readStorage, removeStorage, writeStorage } from "../../../lib/storage";

const SAVE_DELAY_MS = 600;

export const draftStorageKey = (testId: string) => `careerportal:techtest-draft:${testId}`;

export type DraftStatus = "idle" | "saved" | "unavailable";

/**
 * A take-home answer autosaved to this browser (debounced, flushed when the
 * page is hidden or the editor unmounts). Storage failures never throw; the
 * status reports "unavailable" instead so the UI can say drafts aren't saved.
 * Nothing is written once the account it was opened under has signed out:
 * sign-out clears drafts, and the flush that runs as the editor unmounts
 * must not write the text back.
 */
export function useSubmissionDraft(testId: string, fallback: string) {
  const key = draftStorageKey(testId);
  const [openedBy] = useState(privateDraftOwner);
  const [value, setValue] = useState(() => readStorage(key) ?? fallback);
  const [status, setStatus] = useState<DraftStatus>("idle");
  const pendingRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const pending = pendingRef.current;
    if (pending === null) return;
    pendingRef.current = null;
    if (!canWritePrivateDraft(openedBy)) return;
    if (pending) {
      setStatus(writeStorage(key, pending) ? "saved" : "unavailable");
    } else {
      removeStorage(key);
      setStatus("idle");
    }
  }, [key, openedBy]);

  const update = useCallback(
    (next: string) => {
      setValue(next);
      pendingRef.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [flush],
  );

  /** Forget the draft (after a successful submit). */
  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    pendingRef.current = null;
    removeStorage(key);
    setStatus("idle");
  }, [key]);

  useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  return { value, update, status, clear };
}
