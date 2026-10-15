import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Loader2 } from "lucide-react";

/** A4 at 96dpi. */
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const MAX_SCALE = 1.5;

/** No scrollbars inside the frame: it is sized to the whole document and the wrapper scrolls. */
const FRAME_STYLE = "<style>html,body{overflow:hidden!important}</style>";

function withFrameStyle(html: string): string {
  const head = html.search(/<\/head>/i);
  return head === -1 ? FRAME_STYLE + html : html.slice(0, head) + FRAME_STYLE + html.slice(head);
}

/**
 * Renders server HTML at A4 width, scaled to the column. The iframe is sized
 * to the full document height so every page is reachable by scrolling the
 * wrapper, and the scroll position survives preview refreshes.
 *
 * Security: `sandbox="allow-same-origin"` (needed to measure the document)
 * without `allow-scripts` keeps the content inert. Never add allow-scripts
 * here — together they would let the HTML escape the sandbox.
 */
export function PreviewFrame({
  html,
  isLoading,
  title,
  className = "",
}: {
  html: string | undefined;
  isLoading: boolean;
  title: string;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [docHeight, setDocHeight] = useState(PAGE_HEIGHT);
  const srcDoc = useMemo(() => (html ? withFrameStyle(html) : ""), [html]);
  const hasContent = srcDoc.length > 0;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width;
      if (width) setScale(Math.min(MAX_SCALE, width / PAGE_WIDTH));
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [hasContent]);

  const measure = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc?.documentElement) return;
    // offsetHeight is the content height. scrollHeight is never less than the
    // frame's own height, so the preview could only grow, never shrink, when
    // content is removed.
    const height = Math.max(doc.documentElement.offsetHeight, doc.body?.offsetHeight ?? 0);
    if (height > 0) setDocHeight(height);
  }, []);

  const onLoad = useCallback(() => {
    measure();
    // Web fonts can change the height after load.
    frameRef.current?.contentDocument?.fonts?.ready.then(measure).catch(() => undefined);
  }, [measure]);

  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-900 shadow-sm flex flex-col ${className}`}
    >
      {isLoading && !hasContent ? (
        <div role="status" className="flex flex-col items-center justify-center py-24 text-center w-full flex-1">
          <Loader2 className="h-8 w-8 text-accent animate-spin mb-3" aria-hidden="true" />
          <p className="text-xs text-gray-500 dark:text-gray-400">Loading preview…</p>
        </div>
      ) : hasContent ? (
        <div
          ref={wrapperRef}
          tabIndex={0}
          aria-label={`${title} (scrollable)`}
          className="w-full overflow-y-auto overflow-x-hidden flex-1 min-h-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
        >
          <div style={{ width: PAGE_WIDTH * scale, height: docHeight * scale }}>
            <div style={{ width: PAGE_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <iframe
                ref={frameRef}
                srcDoc={srcDoc}
                title={title}
                onLoad={onLoad}
                tabIndex={-1}
                sandbox="allow-same-origin"
                className="block border-0 bg-white pointer-events-none"
                style={{ width: PAGE_WIDTH, height: docHeight }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center w-full flex-1">
          <div className="h-16 w-16 rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-gray-400 dark:text-gray-600" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No preview available</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Add sections to see your CV come to life
          </p>
        </div>
      )}
    </div>
  );
}
