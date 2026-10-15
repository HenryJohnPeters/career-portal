import { useEffect } from "react";
import { useLatestRef } from "./useStoreSelector";

/**
 * While there are unsaved edits: ask before the tab closes or reloads, and save
 * when the page is hidden (tab switch, app switch on mobile) — the most common
 * moment work is lost. In-app navigation unmounts the editor, which flushes.
 */
export function useUnsavedChangesGuard(
  hasUnsavedChanges: () => boolean,
  flush: () => Promise<unknown>,
): void {
  const latest = useLatestRef({ hasUnsavedChanges, flush });

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!latest.current.hasUnsavedChanges()) return;
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
}
