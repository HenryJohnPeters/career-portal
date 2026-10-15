import { useCallback, useRef, useState } from "react";
import { downloadBlob } from "@careerportal/web/data-access";
import { showToast } from "../../../lib/toast";
import { openPendingWindow, showBlobInWindow } from "../lib/files";

export type PdfAction = "preview" | "download";

const STALE_PDF_MESSAGE =
  "Your latest changes couldn't be saved, so the PDF would be out of date. Fix the problem shown in the editor and try again.";

/**
 * PDF preview/download with one request at a time. Pending edits are saved
 * first (`prepare`), the preview tab is opened synchronously inside the click
 * (so pop-up blockers allow it), and request errors are toasted by the global
 * mutation handler.
 */
export function usePdfExport(
  fetchPdf: () => Promise<{ blob: Blob; filename: string }>,
  prepare: () => Promise<boolean>,
) {
  const [busy, setBusy] = useState<PdfAction | null>(null);
  // A ref, not state: two quick clicks land before the re-render.
  const running = useRef(false);

  const start = (action: PdfAction) => {
    if (running.current) return false;
    running.current = true;
    setBusy(action);
    return true;
  };
  const finish = () => {
    running.current = false;
    setBusy(null);
  };

  const download = useCallback(async () => {
    if (!start("download")) return;
    try {
      if (!(await prepare())) {
        showToast("error", STALE_PDF_MESSAGE);
        return;
      }
      const { blob, filename } = await fetchPdf();
      downloadBlob(blob, filename);
    } catch {
      // Toasted by the global mutation error handler.
    } finally {
      finish();
    }
  }, [fetchPdf, prepare]);

  const preview = useCallback(async () => {
    if (running.current) return;
    const win = openPendingWindow("Preparing your PDF…");
    if (!win) {
      showToast(
        "warning",
        "Your browser blocked the preview tab. Allow pop-ups for this site, or use Download PDF.",
      );
      return;
    }
    start("preview");
    try {
      if (!(await prepare())) {
        win.close();
        showToast("error", STALE_PDF_MESSAGE);
        return;
      }
      const { blob } = await fetchPdf();
      showBlobInWindow(win, blob);
    } catch {
      win.close();
    } finally {
      finish();
    }
  }, [fetchPdf, prepare]);

  return { busy, preview, download };
}
