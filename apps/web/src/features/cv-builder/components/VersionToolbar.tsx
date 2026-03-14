import {
  LayoutList,
  Download,
  PanelRightOpen,
  PanelRightClose,
  Eye,
} from "lucide-react";
import type { CvSection, CvVersion } from "@careerportal/shared/types";

interface VersionToolbarProps {
  version: CvVersion;
  sections: CvSection[];
  showPreview: boolean;
  onTogglePreview: () => void;
  onPreviewPdf: () => void;
  onDownloadPdf: () => void;
}

export function VersionToolbar({
  version,
  sections,
  showPreview,
  onTogglePreview,
  onPreviewPdf,
  onDownloadPdf,
}: VersionToolbarProps) {
  const filledCount = sections.filter(
    (s) => s.content.trim().length > 0
  ).length;

  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
            <LayoutList className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">
              {version.title}
            </h2>
            <p className="text-xs text-text-secondary">
              {sections.length} section{sections.length !== 1 ? "s" : ""}
              {sections.length > 0 && (
                <>
                  <span className="mx-1.5 text-gray-300 dark:text-gray-600">
                    ·
                  </span>
                  {filledCount} filled
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />

          <button
            onClick={onTogglePreview}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              showPreview
                ? "border-primary-500/30 bg-primary-500/10 text-primary-700 dark:text-primary-300"
                : "border-border text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            {showPreview ? (
              <PanelRightClose className="h-3.5 w-3.5" />
            ) : (
              <PanelRightOpen className="h-3.5 w-3.5" />
            )}
            <span className="hidden lg:inline">
              {showPreview ? "Hide" : "Show"} Preview
            </span>
          </button>

          <button
            onClick={onPreviewPdf}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
            title="Preview PDF in new tab"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Preview</span>
          </button>

          <button
            onClick={onDownloadPdf}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-primary-700 shadow-sm transition-all hover:shadow-md"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
