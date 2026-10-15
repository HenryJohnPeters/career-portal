/*
 * Text preparation for browser speech synthesis: make technical prompts sound
 * natural without dropping their content (the spoken question must match the
 * one on screen), then split them into chunks short enough for every engine.
 */

/** Some engines cut utterances off around 200 characters. */
export const MAX_CHUNK_LENGTH = 190;

type Rule = readonly [RegExp, string];

/** Applied in order; each rule assumes the earlier ones already ran. */
const RULES: readonly Rule[] = [
  // Latin abbreviations, before dots are read as "dot".
  [/(?<![\w.])e\.g\.(?=[\s,)]|$)/gi, "for example"],
  [/(?<![\w.])i\.e\.(?=[\s,)]|$)/gi, "that is"],
  [/(?<![\w.])etc\.(?=[\s,)]|$)/gi, "and so on"],
  [/(?<![\w.])vs\.?(?=\s|$)/gi, "versus"],
  // Complexity notation: O(n log n) → "O of n log n", n^2 → "n squared".
  [/\bO\(([^()]{1,24})\)/g, "O of $1"],
  [/\^2\b/g, " squared"],
  // Numbers and dotted identifiers: 3.5 → "3 point 5", Node.js → "Node dot js".
  [/(\d)\.(?=\d)/g, "$1 point "],
  [/(\w)\.(?=\w)/g, "$1 dot "],
  // Empty call parentheses are noise; other parentheticals are spoken as asides.
  [/\(\s*\)/g, ""],
  [/\s*\(\s*/g, ", "],
  [/\s*\)\s*/g, ", "],
  // Slash-joined acronyms before "/" becomes "or".
  [/\bCI\/CD\b/g, "C I C D"],
  [/\bI\/O\b/g, "I O"],
  // Spaced dashes are pauses; joined words are split.
  [/\s+[-–—]+\s+/g, ", "],
  [/([a-z])([A-Z])/g, "$1 $2"],
  [/[_-]/g, " "],
  [/\s*\/\s*/g, " or "],
  [/\s*&\s*/g, " and "],
  // Acronyms engines tend to read as words.
  [/\bAPIs\b/g, "A P Is"],
  [/\bAPI\b/g, "A P I"],
  [/\bHTTPS\b/g, "H T T P S"],
  [/\bHTTP\b/g, "H T T P"],
  [/\bJWT\b/g, "J W T"],
  [/\bSQL\b/g, "S Q L"],
  [/\bSRE\b/g, "S R E"],
  [/\bUI\b/g, "U I"],
  [/\bUX\b/g, "U X"],
  [/\bPR\b/g, "P R"],
  [/\bQA\b/g, "Q A"],
  [/\bETA\b/g, "E T A"],
  [/\bK8s\b/gi, "kubernetes"],
  [/\bDB\b/g, "database"],
  // Punctuation tidy-up.
  [/\.{2,}/g, "."],
  [/\s*([?.!,:;])\s*/g, "$1 "],
  [/,(?:\s*,)+/g, ","],
  [/([?.!:;])\s*,/g, "$1"],
  [/,\s*([?.!])/g, "$1"],
  [/^\s*,\s*/, ""],
  [/[\s,]+$/, ""],
  [/\s{2,}/g, " "],
];

export function humanizeSpeechText(rawText: string): string {
  let text = rawText.replace(/\s+/g, " ").trim();
  for (const [pattern, replacement] of RULES) {
    text = text.replace(pattern, replacement);
  }
  return text.trim();
}

/**
 * Split prepared text into chunks of at most `maxLength` characters, on
 * sentence boundaries first, then clause boundaries, then words.
 */
export function splitSpeechChunks(text: string, maxLength = MAX_CHUNK_LENGTH): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  const pushWords = (clause: string) => {
    let wordChunk = "";
    for (const word of clause.split(" ")) {
      const candidate = wordChunk ? `${wordChunk} ${word}` : word;
      if (candidate.length <= maxLength) {
        wordChunk = candidate;
      } else {
        if (wordChunk) chunks.push(wordChunk);
        wordChunk = word;
      }
    }
    return wordChunk;
  };

  for (const sentence of sentences) {
    const clauses =
      sentence.length > maxLength
        ? sentence
            .split(/(?<=[,;:])\s+/)
            .map((c) => c.trim())
            .filter(Boolean)
        : [sentence];

    for (const clause of clauses) {
      const next = current ? `${current} ${clause}` : clause;
      if (next.length <= maxLength) {
        current = next;
        continue;
      }
      if (current) chunks.push(current);
      current = clause.length <= maxLength ? clause : pushWords(clause);
    }
  }

  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : text ? [text] : [];
}
