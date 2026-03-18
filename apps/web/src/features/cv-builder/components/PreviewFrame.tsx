import { RefObject, useEffect, useRef, useState } from "react";
import { FileText, Loader2 } from "lucide-react";

interface PreviewFrameProps {
  iframeRef: RefObject<HTMLIFrameElement>;
  srcDoc?: string;
  hasContent: boolean;
  isLoading: boolean;
  title?: string;
  className?: string;
}

export function PreviewFrame({
  iframeRef,
  srcDoc,
  hasContent,
  isLoading,
  title = "CV Preview",
  className = "",
}: PreviewFrameProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // A4 content width in px (794px = 210mm at 96dpi)
  const CV_CONTENT_WIDTH = 794;

  useEffect(() => {
    if (!hasContent) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setScale(width / CV_CONTENT_WIDTH);
    });
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [hasContent]);

  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-900 shadow-sm flex flex-col ${className}`}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center w-full flex-1">
          <Loader2 className="h-8 w-8 text-accent animate-spin mb-3" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Loading preview…
          </p>
        </div>
      ) : hasContent ? (
        // Measure available width, then scale the fixed-width iframe to fit
        <div
          ref={wrapperRef}
          className="w-full overflow-y-auto overflow-x-hidden flex-1 min-h-0"
        >
          <div
            style={{
              width: CV_CONTENT_WIDTH,
              transformOrigin: "top left",
              transform: `scale(${scale})`,
              // collapse the extra space the unscaled element would take
              height: `calc(100% / ${scale})`,
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={srcDoc}
              title={title}
              className="border-0 bg-white block h-full"
              style={{
                width: CV_CONTENT_WIDTH,
              }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center w-full flex-1">
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
  );
}
