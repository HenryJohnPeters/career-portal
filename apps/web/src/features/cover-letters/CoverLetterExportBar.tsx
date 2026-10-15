import { useCallback, useId, useState } from "react";
import { Copy, Download, Eye, FileDown, Loader2 } from "lucide-react";
import type { CvVersion } from "@careerportal/shared/types";
import { downloadBlob, useDownloadCoverLetterPdf } from "@careerportal/web/data-access";
import { showToast } from "../../lib/toast";
import { usePdfExport } from "../cv-builder/hooks/usePdfExport";
import { copyText, toSafeFilename } from "../cv-builder/lib/files";

const BUTTON =
  "inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";

const NO_LETTERHEAD = "none";

/**
 * Copy, .txt and PDF export. The PDF can use a CV version's contact details
 * and theme as its letterhead (the active CV by default).
 */
export function CoverLetterExportBar({
  letterId,
  title,
  body,
  cvVersions,
  prepare,
}: {
  letterId: string;
  title: string;
  body: string;
  cvVersions: CvVersion[];
  /** Save pending edits first so the PDF matches the editor. */
  prepare: () => Promise<boolean>;
}) {
  const ids = useId();
  const downloadPdf = useDownloadCoverLetterPdf();
  /** null = follow the active CV. */
  const [letterhead, setLetterhead] = useState<string | null>(null);
  const activeCvId = cvVersions.find((v) => v.isActive)?.id ?? cvVersions[0]?.id ?? NO_LETTERHEAD;
  const selectedLetterhead = letterhead ?? activeCvId;
  const isEmpty = body.trim().length === 0;

  const downloadMutate = downloadPdf.mutateAsync;
  const fetchPdf = useCallback(
    () =>
      downloadMutate({
        id: letterId,
        cvVersionId: selectedLetterhead === NO_LETTERHEAD ? null : selectedLetterhead,
      }),
    [downloadMutate, letterId, selectedLetterhead],
  );
  const pdf = usePdfExport(fetchPdf, prepare);

  const copy = async () => {
    if (await copyText(body)) showToast("success", "Cover letter copied to the clipboard.");
    else showToast("error", "Couldn't copy automatically — select the text and copy it instead.");
  };

  const downloadText = () => {
    const blob = new Blob([body.endsWith("\n") ? body : `${body}\n`], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, toSafeFilename(title, "txt", "Cover letter"));
  };

  return (
    <section aria-label="Export" className="flex flex-wrap items-end gap-2">
      <button type="button" className={BUTTON} onClick={() => void copy()} disabled={isEmpty}>
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        Copy
      </button>
      <button type="button" className={BUTTON} onClick={downloadText} disabled={isEmpty}>
        <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
        .txt
      </button>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${ids}-letterhead`} className="text-[10px] font-medium text-text-tertiary">
          PDF letterhead
        </label>
        <select
          id={`${ids}-letterhead`}
          value={selectedLetterhead}
          onChange={(e) => setLetterhead(e.target.value)}
          className="rounded-lg border border-border bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-text-secondary max-w-[11rem]"
        >
          <option value={NO_LETTERHEAD}>No letterhead</option>
          {cvVersions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title}
              {v.isActive ? " (active)" : ""}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className={BUTTON}
        onClick={() => void pdf.preview()}
        disabled={isEmpty || pdf.busy !== null}
        aria-label="Preview the PDF in a new tab"
      >
        {pdf.busy === "preview" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        Preview
      </button>
      <button
        type="button"
        onClick={() => void pdf.download()}
        disabled={isEmpty || pdf.busy !== null}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-primary-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        {pdf.busy === "download" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {pdf.busy === "download" ? "Preparing…" : "Download PDF"}
      </button>
    </section>
  );
}
