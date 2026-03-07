import { useState, useEffect, useRef } from "react";
import { Code2, Copy, Check, RefreshCw, Loader2 } from "lucide-react";

interface HtmlViewerProps {
  html: string | undefined;
  isLoading: boolean;
  isFetching: boolean;
  onRefresh: () => void;
}

export function HtmlViewer({
  html,
  isLoading,
  isFetching,
  onRefresh,
}: HtmlViewerProps) {
  const [editedHtml, setEditedHtml] = useState(html || "");
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update edited HTML when source changes
  useEffect(() => {
    setEditedHtml(html || "");
  }, [html]);

  // Live reload iframe when edited HTML changes
  useEffect(() => {
    if (iframeRef.current && editedHtml) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(editedHtml);
        iframeDoc.close();
      }
    }
  }, [editedHtml]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* HTML Editor */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800/80">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-dark to-accent text-white shadow-sm">
              <Code2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                HTML Source
              </h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Edit and preview live
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isFetching && (
              <Loader2 className="h-3.5 w-3.5 text-accent animate-spin mr-1" />
            )}
            <button
              onClick={onRefresh}
              disabled={isFetching}
              className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              title="Refresh HTML"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleCopy}
              className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Copy HTML"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-8 w-8 text-accent animate-spin mb-3" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Loading HTML...
            </p>
          </div>
        ) : (
          <textarea
            value={editedHtml}
            onChange={(e) => setEditedHtml(e.target.value)}
            className="w-full h-96 p-4 font-mono text-xs text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 border-0 focus:outline-none focus:ring-2 focus:ring-accent-dark/20 resize-none"
            placeholder="HTML will appear here..."
            spellCheck={false}
          />
        )}
      </div>

      {/* Live Preview */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800/80">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-dark to-accent text-white shadow-sm">
              <Code2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Live Preview
              </h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Updates as you type
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 p-4">
          {editedHtml ? (
            <div className="w-full bg-white rounded-lg shadow-lg shadow-black/10 dark:shadow-black/30 overflow-hidden ring-1 ring-black/5">
              <iframe
                ref={iframeRef}
                title="HTML Preview"
                className="w-full border-0 bg-white"
                style={{ height: "75vh", minHeight: "550px" }}
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center w-full">
              <div className="h-16 w-16 rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Code2 className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                No HTML available
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Add sections to generate HTML
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
