import { useCallback, useEffect, useState } from "react";
import { useBlocker, type Location } from "react-router-dom";
import { isLeavingPage, registerUnsavedEdits } from "../../../lib/unsaved-edits";
import { useLatestRef } from "./useStoreSelector";

export interface UnsavedChangesGuard {
  /**
   * A navigation is on hold because some edits couldn't be saved: ask
   * "Leave without saving?" and answer with leave() or stay().
   */
  blocked: boolean;
  /** Continue the navigation; the unsaved edits are lost. */
  leave: () => void;
  /** Cancel the navigation and stay in the editor. */
  stay: () => void;
}

/** Default: any change of page leaves the editor. */
const changesPage = (current: Location, next: Location) => current.pathname !== next.pathname;

/**
 * Keeps unsaved edits from being lost:
 * - In-app navigation that would unmount the editor (sidebar links, the
 *   editor's own Back button, the browser's Back button) waits until pending
 *   edits are saved. If saving fails it stays on hold (`blocked`) until the
 *   user chooses to leave anyway or stay.
 * - Closing or reloading the tab asks first.
 * - Hiding the page (tab switch, app switch on mobile) saves.
 * - Signing out saves first (via the unsaved-edits registry).
 *
 * `leaves(current, next)` says whether a navigation unmounts the editor (by
 * default, a change of path).
 */
export function useUnsavedChangesGuard(
  hasUnsavedChanges: () => boolean,
  flush: () => Promise<boolean>,
  leaves: (current: Location, next: Location) => boolean = changesPage,
): UnsavedChangesGuard {
  const latest = useLatestRef({ hasUnsavedChanges, flush, leaves });

  const shouldBlock = useCallback(
    ({ currentLocation, nextLocation }: { currentLocation: Location; nextLocation: Location }) =>
      latest.current.leaves(currentLocation, nextLocation) && latest.current.hasUnsavedChanges(),
    [latest],
  );
  const blocker = useBlocker(shouldBlock);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (blocker.state !== "blocked") {
      setBlocked(false);
      return;
    }
    let current = true;
    void latest.current.flush().then(
      (saved) => {
        if (!current) return;
        if (saved) blocker.proceed();
        else setBlocked(true);
      },
      () => {
        if (current) setBlocked(true);
      },
    );
    return () => {
      current = false;
    };
  }, [blocker, latest]);

  useEffect(
    () => registerUnsavedEdits(() => latest.current.flush()),
    [latest],
  );

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isLeavingPage() || !latest.current.hasUnsavedChanges()) return;
      void latest.current.flush();
      event.preventDefault();
      // Chrome < 119 and older Safari need returnValue set to show the prompt.
      event.returnValue = "";
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden" && latest.current.hasUnsavedChanges()) {
        void latest.current.flush();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [latest]);

  const leave = useCallback(() => {
    setBlocked(false);
    if (blocker.state === "blocked") blocker.proceed();
  }, [blocker]);

  const stay = useCallback(() => {
    setBlocked(false);
    if (blocker.state === "blocked") blocker.reset();
  }, [blocker]);

  return { blocked, leave, stay };
}
