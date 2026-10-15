/** Markdown formatting for the section editor's toolbar and keyboard shortcuts. */

export type FormatAction =
  | { type: "wrap"; before: string; after: string }
  | { type: "line-prefix"; prefix: string }
  | { type: "insert"; text: string };

export interface FormatResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

/** Apply `action` to `value` at the given selection; returns the new text and selection. */
export function applyFormat(
  value: string,
  start: number,
  end: number,
  action: FormatAction,
): FormatResult {
  switch (action.type) {
    case "wrap": {
      const selected = value.substring(start, end) || "text";
      const next = value.substring(0, start) + action.before + selected + action.after + value.substring(end);
      const selectionStart = start + action.before.length;
      return { value: next, selectionStart, selectionEnd: selectionStart + selected.length };
    }
    case "line-prefix": {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const lineEndIndex = value.indexOf("\n", end);
      const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
      const line = value.substring(lineStart, lineEnd);
      if (line.startsWith(action.prefix)) {
        // Toggle off.
        const next =
          value.substring(0, lineStart) + line.substring(action.prefix.length) + value.substring(lineEnd);
        const caret = Math.max(lineStart, start - action.prefix.length);
        return { value: next, selectionStart: caret, selectionEnd: caret };
      }
      const next = value.substring(0, lineStart) + action.prefix + line + value.substring(lineEnd);
      const caret = start + action.prefix.length;
      return { value: next, selectionStart: caret, selectionEnd: caret };
    }
    case "insert": {
      const text = (start > 0 && value[start - 1] !== "\n" ? "\n" : "") + action.text;
      const next = value.substring(0, start) + text + value.substring(end);
      const caret = start + text.length;
      return { value: next, selectionStart: caret, selectionEnd: caret };
    }
  }
}

export const BOLD: FormatAction = { type: "wrap", before: "**", after: "**" };
export const ITALIC: FormatAction = { type: "wrap", before: "*", after: "*" };
