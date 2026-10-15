/**
 * Question bank text uses a small Markdown subset: fenced code blocks
 * (```lang … ```), indented code blocks (a paragraph whose lines all start
 * with 4 spaces or a tab) and inline `code`. Parsed into plain data so React
 * renders it as text nodes — never as HTML.
 */

export type RichBlock =
  | { kind: "text"; parts: InlinePart[] }
  | { kind: "code"; code: string; language: string | null };

export interface InlinePart {
  code: boolean;
  text: string;
}

const FENCE = /^```\s*([\w+#.-]*)\s*$/;

export function parseRichText(raw: string): RichBlock[] {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  const blocks: RichBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const indented = paragraph.every((line) => /^( {4}|\t)/.test(line));
    if (indented) {
      blocks.push({
        kind: "code",
        code: paragraph.map((line) => line.replace(/^( {4}|\t)/, "")).join("\n"),
        language: null,
      });
    } else {
      blocks.push({ kind: "text", parts: parseInline(paragraph.join("\n")) });
    }
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const fence = FENCE.exec(lines[i].trim());
    if (fence) {
      const end = lines.findIndex((line, j) => j > i && line.trim() === "```");
      if (end !== -1) {
        flushParagraph();
        blocks.push({
          kind: "code",
          code: lines.slice(i + 1, end).join("\n"),
          language: fence[1] || null,
        });
        i = end;
        continue;
      }
    }
    if (lines[i].trim() === "") flushParagraph();
    else paragraph.push(lines[i]);
  }
  flushParagraph();
  return blocks;
}

/** Splits `inline code` spans out of a run of text (unmatched backticks stay literal). */
export function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const pattern = /`([^`\n]+)`/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ code: false, text: text.slice(last, start) });
    parts.push({ code: true, text: match[1] });
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ code: false, text: text.slice(last) });
  return parts;
}

/** What the interviewer voice reads: prose only, with code replaced by a pointer to it. */
export function toSpeakableText(raw: string): string {
  return parseRichText(raw)
    .map((block) =>
      block.kind === "code"
        ? "Take a look at the code snippet."
        : block.parts.map((part) => part.text).join(""),
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The prose of a prompt without its code blocks, for compact labels (reports, lists). */
export function richTextSummary(raw: string): string {
  return parseRichText(raw)
    .flatMap((block) =>
      block.kind === "text"
        ? [block.parts.map((p) => (p.code ? `\`${p.text}\`` : p.text)).join("")]
        : [],
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
