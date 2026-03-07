import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading3,
  Link,
  Minus,
} from "lucide-react";
import { useRef, useCallback } from "react";

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
}

type FormatAction =
  | { type: "wrap"; before: string; after: string }
  | { type: "line-prefix"; prefix: string }
  | { type: "insert"; text: string };

export function MarkdownToolbar({
  textareaRef,
  value,
  onChange,
}: MarkdownToolbarProps) {
  const applyFormat = useCallback(
    (action: FormatAction) => {
      const ta = textareaRef.current;
      if (!ta) return;

      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.substring(start, end);

      let newValue: string;
      let cursorStart: number;
      let cursorEnd: number;

      switch (action.type) {
        case "wrap": {
          const wrapped = `${action.before}${selected || "text"}${
            action.after
          }`;
          newValue = value.substring(0, start) + wrapped + value.substring(end);
          cursorStart = start + action.before.length;
          cursorEnd = cursorStart + (selected || "text").length;
          break;
        }
        case "line-prefix": {
          // Find the start of the current line
          const lineStart = value.lastIndexOf("\n", start - 1) + 1;
          const lineEnd = value.indexOf("\n", end);
          const actualEnd = lineEnd === -1 ? value.length : lineEnd;
          const currentLine = value.substring(lineStart, actualEnd);

          // If line already has the prefix, remove it
          if (currentLine.startsWith(action.prefix)) {
            newValue =
              value.substring(0, lineStart) +
              currentLine.substring(action.prefix.length) +
              value.substring(actualEnd);
            cursorStart = Math.max(lineStart, start - action.prefix.length);
            cursorEnd = cursorStart;
          } else {
            newValue =
              value.substring(0, lineStart) +
              action.prefix +
              currentLine +
              value.substring(actualEnd);
            cursorStart = start + action.prefix.length;
            cursorEnd = cursorStart;
          }
          break;
        }
        case "insert": {
          const needsNewline =
            start > 0 && value[start - 1] !== "\n" ? "\n" : "";
          const text = needsNewline + action.text;
          newValue = value.substring(0, start) + text + value.substring(end);
          cursorStart = start + text.length;
          cursorEnd = cursorStart;
          break;
        }
      }

      onChange(newValue);

      // Restore focus and cursor position
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(cursorStart, cursorEnd);
      });
    },
    [textareaRef, value, onChange]
  );

  const tools = [
    {
      icon: Bold,
      label: "Bold",
      shortcut: "⌘B",
      action: { type: "wrap" as const, before: "**", after: "**" },
    },
    {
      icon: Italic,
      label: "Italic",
      shortcut: "⌘I",
      action: { type: "wrap" as const, before: "*", after: "*" },
    },
    { type: "separator" as const },
    {
      icon: Heading3,
      label: "Subheading",
      shortcut: "",
      action: { type: "line-prefix" as const, prefix: "### " },
    },
    {
      icon: List,
      label: "Bullet List",
      shortcut: "",
      action: { type: "line-prefix" as const, prefix: "- " },
    },
    {
      icon: ListOrdered,
      label: "Numbered List",
      shortcut: "",
      action: { type: "line-prefix" as const, prefix: "1. " },
    },
    { type: "separator" as const },
    {
      icon: Link,
      label: "Link",
      shortcut: "",
      action: { type: "wrap" as const, before: "[", after: "](https://)" },
    },
    {
      icon: Minus,
      label: "Divider",
      shortcut: "",
      action: { type: "insert" as const, text: "\n---\n" },
    },
  ];

  return (
    <div className="flex items-center gap-0.5 border-b border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-700/40 px-2 py-1.5 rounded-t-lg">
      {tools.map((tool, i) => {
        if ("type" in tool && tool.type === "separator") {
          return (
            <div
              key={`sep-${i}`}
              className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1"
            />
          );
        }
        const t = tool as (typeof tools)[0] & {
          icon: any;
          label: string;
          action: FormatAction;
          shortcut: string;
        };
        const Icon = t.icon;
        return (
          <button
            key={t.label}
            type="button"
            onClick={() => applyFormat(t.action)}
            className="rounded-md p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200/70 dark:hover:bg-gray-600/50 transition-colors"
            title={t.shortcut ? `${t.label} (${t.shortcut})` : t.label}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
      <div className="ml-auto text-[9px] font-medium text-gray-400 dark:text-gray-500 select-none">
        Markdown supported
      </div>
    </div>
  );
}
