export type InlineSegment =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "code"; text: string };

const INLINE_PATTERN = /\*\*([^*\n]+?)\*\*|`([^`\n]+?)`/g;

/**
 * Split scenario text into plain, **bold** and `code` segments. Only these two
 * markers are recognised and nothing is ever interpreted as HTML (AI output
 * can contain markup); unmatched markers are kept as literal text.
 */
export function parseInlineMarkdown(input: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let last = 0;
  for (const match of input.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) segments.push({ type: "text", text: input.slice(last, index) });
    if (match[1] !== undefined) segments.push({ type: "strong", text: match[1] });
    else segments.push({ type: "code", text: match[2] });
    last = index + match[0].length;
  }
  if (last < input.length) segments.push({ type: "text", text: input.slice(last) });
  return segments;
}
