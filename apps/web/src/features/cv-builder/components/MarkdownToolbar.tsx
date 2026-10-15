import type { RefObject } from "react";
import type { LucideIcon } from "lucide-react";
import { Bold, Heading3, Italic, Link, List, ListOrdered, Minus } from "lucide-react";
import { applyFormat, BOLD, ITALIC, type FormatAction } from "../lib/markdown-format";

interface Tool {
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  action: FormatAction;
}

const TOOL_GROUPS: Tool[][] = [
  [
    { icon: Bold, label: "Bold", shortcut: "Ctrl+B", action: BOLD },
    { icon: Italic, label: "Italic", shortcut: "Ctrl+I", action: ITALIC },
  ],
  [
    { icon: Heading3, label: "Subheading", action: { type: "line-prefix", prefix: "### " } },
    { icon: List, label: "Bullet list", action: { type: "line-prefix", prefix: "- " } },
    { icon: ListOrdered, label: "Numbered list", action: { type: "line-prefix", prefix: "1. " } },
  ],
  [
    { icon: Link, label: "Link", action: { type: "wrap", before: "[", after: "](https://)" } },
    { icon: Minus, label: "Divider", action: { type: "insert", text: "\n---\n" } },
  ],
];

/** Apply a format to a textarea and restore its focus and selection. */
export function formatTextarea(
  textarea: HTMLTextAreaElement,
  value: string,
  action: FormatAction,
  onChange: (value: string) => void,
) {
  const result = applyFormat(value, textarea.selectionStart, textarea.selectionEnd, action);
  onChange(result.value);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
  });
}

export function MarkdownToolbar({
  textareaRef,
  value,
  onChange,
}: {
  textareaRef: RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex items-center gap-0.5 border-b border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-700/40 px-2 py-1.5 rounded-t-lg"
    >
      {TOOL_GROUPS.map((group, groupIndex) => (
        <div key={groupIndex} className="flex items-center gap-0.5">
          {groupIndex > 0 && <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" aria-hidden="true" />}
          {group.map((tool) => {
            const Icon = tool.icon;
            const label = tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label;
            return (
              <button
                key={tool.label}
                type="button"
                aria-label={label}
                title={label}
                onClick={() => {
                  const textarea = textareaRef.current;
                  if (textarea) formatTextarea(textarea, value, tool.action, onChange);
                }}
                className="rounded-md p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200/70 dark:hover:bg-gray-600/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      ))}
      <div className="ml-auto text-[10px] font-medium text-gray-500 dark:text-gray-400 select-none">
        Markdown supported
      </div>
    </div>
  );
}
