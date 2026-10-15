import { ArrowLeft, Download, Eye, LayoutList, Loader2, PanelRightClose, PanelRightOpen } from "lucide-react";
import type { CvSection, CvVersion } from "@careerportal/shared/types";
import type { PdfAction } from "../hooks/usePdfExport";

interface VersionToolbarProps {
  version: CvVersion;
  sections: CvSection[];
  showPreview: boolean;
  pdfBusy: PdfAction | null;
  onBack: () => void;
  onTogglePreview: () => void;
  onPreviewPdf: () => void;
  onDownloadPdf: () => void;
}

export function VersionToolbar({
  version,
  sections,
  showPreview,
  pdfBusy,
  onBack,
  onTogglePreview,
  onPreviewPdf,
  onDownloadPdf,
}: VersionToolbarProps) {
  const filled = sections.filter((s) => s.content.trim().length > 0).length;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to all CVs
      </button>

      <div className="rounded-xl border border-border bg-bg-elevated p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
              <LayoutList className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-text-primary truncate">{version.title}</h2>
              <p className="text-xs text-text-secondary">
                {sections.length} section{sections.length !== 1 ? "s" : ""}
                {sections.length > 0 && <> · {filled} filled</>}
                {version.isActive && <> · Active CV</>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onTogglePreview}
              aria-pressed={showPreview}
              aria-label={`${showPreview ? "Hide" : "Show"} live preview`}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                showPreview
                  ? "border-primary-500/30 bg-primary-500/10 text-primary-700 dark:text-primary-300"
                  : "border-border text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {showPreview ? (
                <PanelRightClose className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <PanelRightOpen className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="hidden lg:inline">{showPreview ? "Hide" : "Show"} preview</span>
            </button>

            <button
              type="button"
              onClick={onPreviewPdf}
              disabled={pdfBusy !== null}
              aria-busy={pdfBusy === "preview" || undefined}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg-tertiary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              title="Open the PDF in a new tab"
              aria-label="Preview PDF in a new tab"
            >
              {pdfBusy === "preview" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">Preview PDF</span>
            </button>

            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={pdfBusy !== null}
              aria-busy={pdfBusy === "download" || undefined}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-primary-700 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pdfBusy === "download" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {pdfBusy === "download" ? "Preparing…" : "Download PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
