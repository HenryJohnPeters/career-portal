/** One word of text, as used by the keyword matcher. */
export interface Token {
  /** Lowercase form used for matching. */
  norm: string;
  /** Original casing, for case-sensitive forms such as "Go" or "REST". */
  raw: string;
  /** First word of a line or sentence (capitalised for grammar, not as a name). */
  sentenceStart: boolean;
}

/*
 * Letters, digits and the characters that appear inside tech names
 * ("c++", "c#", "node.js", ".net"). Everything else, including "/" and "-",
 * separates tokens, so "CI/CD" → ci, cd and "front-end" → front, end. The
 * lexicon tokenises its phrases the same way, so both sides line up.
 */
const TOKEN_PATTERN = /[A-Za-z0-9+#.]+/g;
const SENTENCE_BREAK = /[\n!?;•]/;

/** Longer tokens can't be keywords (and are usually URLs or junk). */
const MAX_TOKEN_LENGTH = 40;

/** Linear time: one regex pass with a single character class, no backtracking. */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let previousEnd = 0;
  let previousEndedSentence = true;
  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const start = match.index ?? 0;
    const sentenceStart =
      previousEndedSentence || SENTENCE_BREAK.test(text.slice(previousEnd, start));
    previousEnd = start + match[0].length;
    previousEndedSentence = match[0].endsWith(".");
    if (match[0].length > MAX_TOKEN_LENGTH) continue;
    const raw = trimDots(match[0]);
    if (raw) tokens.push({ raw, norm: raw.toLowerCase(), sentenceStart });
  }
  return tokens;
}

/** Drops sentence dots ("React." → "React") but keeps ".NET" and "Node.js". */
function trimDots(token: string): string {
  let end = token.length;
  while (end > 0 && token[end - 1] === ".") end--;
  let start = 0;
  if (token[0] === "." && !isLetter(token[1])) {
    while (start < end && token[start] === ".") start++;
  }
  return token.slice(start, end);
}

function isLetter(char: string | undefined): boolean {
  return char !== undefined && /[A-Za-z]/.test(char);
}
