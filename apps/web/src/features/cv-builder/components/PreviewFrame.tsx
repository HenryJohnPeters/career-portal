import { RefObject } from "react";
import { FileText, Loader2 } from "lucide-react";

interface PreviewFrameProps {
  iframeRef: RefObject<HTMLIFrameElement>;
  srcDoc?: string;
  hasContent: boolean;
  isLoading: boolean;
  title?: string;
}

export function PreviewFrame({
  iframeRef,
  srcDoc,
  hasContent,
  isLoading,
  title = "CV Preview",
}: PreviewFrameProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 shadow-inner overflow-hidden">
      <div className="p-4 flex justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center w-full">
            <Loader2 className="h-8 w-8 text-accent animate-spin mb-3" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Loading preview…
            </p>
          </div>
        ) : hasContent ? (
          <div className="w-full bg-white rounded-lg shadow-lg shadow-black/10 dark:shadow-black/30 overflow-hidden ring-1 ring-black/5">
            <iframe
              ref={iframeRef}
              srcDoc={srcDoc}
              title={title}
              className="w-full border-0 bg-white"
              style={{ height: "75vh", minHeight: "550px" }}
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center w-full">
            <div className="h-16 w-16 rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              No preview available
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Add sections to see your CV come to life
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
