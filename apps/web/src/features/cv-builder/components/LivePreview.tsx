import { Eye, Loader2, Maximize2, RefreshCw } from "lucide-react";
import { getErrorMessage } from "@careerportal/web/data-access";
import { PreviewFrame } from "./PreviewFrame";

interface LivePreviewProps {
  html: string | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRefresh: () => void;
  onFullPreview: () => void;
  fullPreviewBusy: boolean;
}

export function LivePreview({
  html,
  isLoading,
  isFetching,
  error,
  onRefresh,
  onFullPreview,
  fullPreviewBusy,
}: LivePreviewProps) {
  return (
    <section aria-label="Live preview" className="flex flex-col h-full gap-3">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
              <Eye className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Live preview</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Updates a moment after each save</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isFetching && (
              <Loader2 className="h-3.5 w-3.5 text-accent animate-spin mr-1" aria-label="Refreshing preview" />
            )}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isFetching}
              className="rounded-lg p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              aria-label="Refresh preview"
              title="Refresh preview"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onFullPreview}
              disabled={fullPreviewBusy}
              className="rounded-lg p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              aria-label="Open the PDF in a new tab"
              title="Open the PDF in a new tab"
            >
              {fullPreviewBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {error && !html ? (
        <div role="alert" className="flex-1 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-sm text-red-700 dark:text-red-300">
            {getErrorMessage(error, "The preview couldn't be loaded.")}
          </p>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-3 text-xs font-semibold text-red-700 dark:text-red-300 underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {error && !isFetching && (
            <p role="status" className="text-[11px] text-amber-700 dark:text-amber-400">
              The preview couldn't refresh, so it may be out of date.{" "}
              <button type="button" onClick={onRefresh} className="font-semibold underline">
                Retry
              </button>
            </p>
          )}
          <PreviewFrame html={html} isLoading={isLoading} title="CV preview" className="flex-1 min-h-0" />
        </>
      )}
    </section>
  );
}
