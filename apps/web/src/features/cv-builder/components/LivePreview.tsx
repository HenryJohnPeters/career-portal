import { RefObject } from "react";
import { Eye, RefreshCw, Loader2, Maximize2 } from "lucide-react";
import { PreviewFrame } from "./PreviewFrame";

interface LivePreviewProps {
  iframeRef: RefObject<HTMLIFrameElement>;
  previewHtml: string | undefined;
  previewSrcDoc: string;
  isPreviewLoading: boolean;
  isPreviewFetching: boolean;
  onRefresh: () => void;
  onFullPreview: () => void;
}

export function LivePreview({
  iframeRef,
  previewHtml,
  previewSrcDoc,
  isPreviewLoading,
  isPreviewFetching,
  onRefresh,
  onFullPreview,
}: LivePreviewProps) {
  return (
    <div className="flex flex-col h-full gap-3">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Live Preview
              </h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Auto-updates on save
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isPreviewFetching && (
              <Loader2 className="h-3.5 w-3.5 text-accent animate-spin mr-1" />
            )}
            <button
              onClick={onRefresh}
              disabled={isPreviewFetching}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              title="Refresh preview"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onFullPreview}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Open full preview in new tab"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <PreviewFrame
        iframeRef={iframeRef}
        srcDoc={previewSrcDoc}
        hasContent={!!previewHtml}
        isLoading={isPreviewLoading}
        title="CV Preview"
        className="flex-1 min-h-0"
      />
    </div>
  );
}
