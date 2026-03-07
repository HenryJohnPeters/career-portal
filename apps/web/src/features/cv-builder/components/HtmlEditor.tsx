import { useState, useEffect, useRef } from "react";
import {
  Code2,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  FileCode,
  Settings,
  Eye,
  EyeOff,
  WrapText,
  Search,
} from "lucide-react";
import Editor, { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

interface HtmlEditorProps {
  html: string | undefined;
  isLoading: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  onHtmlChange: (html: string) => void;
}

export function HtmlEditor({
  html,
  isLoading,
  isFetching,
  onRefresh,
  onHtmlChange,
}: HtmlEditorProps) {
  const [editedHtml, setEditedHtml] = useState(html || "");
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [wordWrap, setWordWrap] = useState<"on" | "off">("on");
  const [theme, setTheme] = useState<"vs-dark" | "light">("vs-dark");
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  // Update edited HTML when source changes
  useEffect(() => {
    setEditedHtml(html || "");
  }, [html]);

  // Auto-format when HTML content is loaded
  useEffect(() => {
    if (editorRef.current && editedHtml && !isLoading) {
      // Wait a bit for the editor to fully render the content
      const timer = setTimeout(() => {
        handleFormat();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [editedHtml, isLoading]);

  // Notify parent of changes
  useEffect(() => {
    onHtmlChange(editedHtml);
  }, [editedHtml, onHtmlChange]);

  // Detect system dark mode
  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(isDark ? "vs-dark" : "light");
  }, []);

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure HTML language options
    monaco.languages.html.htmlDefaults.setOptions({
      format: {
        tabSize: 2,
        insertSpaces: true,
        wrapLineLength: 120,
        unformatted: "",
        contentUnformatted: "pre,code,textarea",
        indentInnerHtml: true,
        preserveNewLines: true,
        maxPreserveNewLines: 2,
        indentHandlebars: false,
        endWithNewline: false,
        extraLiners: "head, body, /html",
        wrapAttributes: "auto",
      },
      suggest: {
        html5: true,
        angular1: false,
        ionic: false,
      },
    });

    // Add custom keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleFormat();
    });

    // Enable emmet
    editor.updateOptions({
      quickSuggestions: {
        other: true,
        comments: false,
        strings: true,
      },
    });

    // Auto-format on initial load
    if (editedHtml) {
      setTimeout(() => {
        editor.getAction("editor.action.formatDocument")?.run();
      }, 100);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run();
    }
  };

  const handleZoomIn = () => {
    setFontSize((prev) => Math.min(prev + 1, 24));
  };

  const handleZoomOut = () => {
    setFontSize((prev) => Math.max(prev - 1, 10));
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([editedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cv-template.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFindReplace = () => {
    if (editorRef.current) {
      editorRef.current.trigger("", "actions.find", null);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "vs-dark" ? "light" : "vs-dark"));
  };

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-white dark:bg-gray-900"
    : "rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden";

  const editorHeight = isFullscreen
    ? "calc(100vh - 60px)"
    : "calc(100vh - 20rem)";

  return (
    <div className={containerClass}>
      {/* Enhanced Header with Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-800/60">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-dark to-accent text-white shadow-sm">
            <FileCode className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              HTML Editor
              <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-accent-muted/30 text-accent-dark dark:text-accent">
                Monaco
              </span>
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Powered by VS Code • Full IDE features
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isFetching && (
            <div className="mr-2 flex items-center gap-1.5 text-accent-light">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="text-[10px] font-medium">Syncing...</span>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center gap-0.5 mr-1 bg-white dark:bg-gray-700/50 rounded-lg p-0.5 border border-gray-200 dark:border-gray-600">
            <button
              onClick={handleZoomOut}
              className="rounded p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 px-1.5 min-w-[32px] text-center">
              {fontSize}px
            </span>
            <button
              onClick={handleZoomIn}
              className="rounded p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Editor Options */}
          <button
            onClick={handleFindReplace}
            className="rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors"
            title="Find & Replace (Ctrl+F)"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() =>
              setWordWrap((prev) => (prev === "on" ? "off" : "on"))
            }
            className={`rounded-lg p-1.5 transition-colors ${
              wordWrap === "on"
                ? "text-accent-dark dark:text-accent bg-accent-muted/30 dark:bg-accent-muted/20"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700"
            }`}
            title="Toggle Word Wrap"
          >
            <WrapText className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setShowMinimap((prev) => !prev)}
            className={`rounded-lg p-1.5 transition-colors ${
              showMinimap
                ? "text-accent-dark dark:text-accent bg-accent-muted/30 dark:bg-accent-muted/20"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700"
            }`}
            title="Toggle Minimap"
          >
            {showMinimap ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            onClick={toggleTheme}
            className="rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors"
            title="Toggle Theme"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Action Buttons */}
          <button
            onClick={handleFormat}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent-dark dark:text-accent hover:bg-accent-muted/20 dark:hover:bg-accent-muted/10 transition-colors border border-accent-muted dark:border-accent-muted/50"
            title="Format Document (Ctrl+S)"
          >
            Format
          </button>

          <button
            onClick={onRefresh}
            disabled={isFetching}
            className="rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            title="Refresh HTML from Server"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleDownloadHtml}
            className="rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors"
            title="Download HTML File"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors"
            title="Copy HTML to Clipboard"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-1 bg-gray-50 dark:bg-gray-800/40 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="font-semibold">HTML</span>
            <span className="text-gray-400 dark:text-gray-500">•</span>
            <span>UTF-8</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-gray-400 dark:text-gray-500">Lines:</span>
            <span className="font-mono font-semibold">
              {editedHtml.split("\n").length}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-gray-400 dark:text-gray-500">Size:</span>
            <span className="font-mono font-semibold">
              {(new Blob([editedHtml]).size / 1024).toFixed(2)} KB
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <span>Tab Size: 2</span>
          <span>•</span>
          <span>Spaces</span>
          <span>•</span>
          <span className="capitalize">
            {theme === "vs-dark" ? "Dark" : "Light"}
          </span>
        </div>
      </div>

      {/* Monaco Editor */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-900">
          <Loader2 className="h-10 w-10 text-accent animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Loading Editor...
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Initializing Monaco Editor with IntelliSense
          </p>
        </div>
      ) : (
        <div className="relative">
          <Editor
            height={editorHeight}
            defaultLanguage="html"
            language="html"
            value={editedHtml}
            onChange={(value: string | undefined) => setEditedHtml(value || "")}
            onMount={handleEditorDidMount}
            theme={theme}
            options={{
              fontSize: fontSize,
              fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
              fontLigatures: true,
              lineNumbers: "on",
              rulers: [80, 120],
              minimap: {
                enabled: showMinimap,
                renderCharacters: false,
                maxColumn: 120,
              },
              scrollBeyondLastLine: false,
              wordWrap: wordWrap,
              automaticLayout: true,
              formatOnPaste: true,
              formatOnType: true,
              tabSize: 2,
              insertSpaces: true,
              detectIndentation: true,
              trimAutoWhitespace: true,
              autoIndent: "full",
              folding: true,
              foldingStrategy: "indentation",
              showFoldingControls: "always",
              bracketPairColorization: {
                enabled: true,
              },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              suggest: {
                showWords: true,
                showSnippets: true,
              },
              quickSuggestions: {
                other: true,
                comments: false,
                strings: true,
              },
              snippetSuggestions: "top",
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: "on",
              tabCompletion: "on",
              hover: {
                enabled: true,
              },
              contextmenu: true,
              mouseWheelZoom: true,
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              renderLineHighlight: "all",
              renderWhitespace: "selection",
              scrollbar: {
                vertical: "visible",
                horizontal: "visible",
                verticalScrollbarSize: 14,
                horizontalScrollbarSize: 14,
              },
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              matchBrackets: "always",
              renderControlCharacters: false,
              links: true,
              colorDecorators: true,
              codeLens: false,
              padding: {
                top: 16,
                bottom: 16,
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
