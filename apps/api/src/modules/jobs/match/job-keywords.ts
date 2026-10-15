import { LEXICON, scanKeywords, type Keyword, type KeywordKind } from "./lexicon";
import { tokenize } from "./tokenize";

/** A keyword the job description asks for, with its importance. */
export interface JobKeyword {
  id: string;
  keyword: string;
  kind: KeywordKind;
  /** Relative importance, roughly 0.3-4 (one decimal). */
  weight: number;
  /** False for frequent-word fallbacks (matched as plain words, not via the lexicon). */
  fromLexicon: boolean;
}

/** Longer job descriptions are cut (the DTOs already cap them at this size). */
export const MAX_JOB_DESCRIPTION_CHARS = 20_000;
/** The most important keywords kept; the rest add noise. */
export const MAX_KEYWORDS = 40;
/** Below this many lexicon hits, frequent words are added as keywords. */
const MIN_LEXICON_KEYWORDS = 5;
const MAX_FALLBACK_TERMS = 8;
const FALLBACK_WEIGHT = 0.5;

const KIND_WEIGHT: Record<KeywordKind, number> = {
  tech: 1,
  practice: 0.8,
  role: 0.6,
  soft: 0.5,
};

type Zone = "required" | "core" | "neutral" | "other" | "nice";

/** Weight multiplier for keywords found in each part of the advert. */
const ZONE_WEIGHT: Record<Zone, number> = {
  required: 1.5,
  core: 1.2,
  neutral: 1,
  other: 0.8,
  nice: 0.6,
};

const NICE_PATTERN =
  /\b(nice[ -]to[ -]haves?|bonus|desirable|preferred|good to have|would be (?:a )?(?:plus|great|nice)|a plus|extra credit|not required|optional)\b/i;
const REQUIRED_HEADING =
  /\b(requirements?|required|must[ -]haves?|essentials?|qualifications?|about you|who you are|you have|you bring|what you(?:'ll| will)? (?:need|bring|have)|what we(?:'re| are) looking for|skills|experience|tech(?:nology)? stack|our stack)\b/i;
const CORE_HEADING =
  /\b(responsibilities|what you(?:'ll| will) do|the role|about the role|your role|day[ -]to[ -]day)\b/i;
const OTHER_HEADING =
  /\b(benefits|perks|what we offer|about us|about the company|who we are|salary|compensation|how to apply|our values|culture|equal opportunit\w*)\b/i;
const REQUIRED_INLINE =
  /\b(must|required|essential|proficien\w*|expert\w*|extensive|strong (?:experience|knowledge|understanding)|solid (?:experience|knowledge|understanding))\b/i;

/** Headings are at most this long (the label before a ":" when there is one). */
const MAX_HEADING_CHARS = 70;
const MAX_HEADING_WORDS = 5;
/** "- Rust", "• Go", "1. Kafka": list items, never headings. */
const LIST_ITEM = /^(?:[-*•·▪◦–]|\d{1,2}[.)])\s/;

/**
 * The section a heading line starts, or null for ordinary lines. A heading is
 * marked ("# Skills", "Requirements:", "NICE TO HAVE", or the label of
 * "Nice to have: Rust"), or is a short line that names no keyword: a short
 * line such as "Experience with Rust" is a list item pasted without its
 * bullet, so it must not switch a "nice to have" list to "required".
 */
function headingZone(line: string, namesKeyword: boolean): Zone | null {
  if (LIST_ITEM.test(line)) return null;
  const colon = line.indexOf(":");
  const label = colon > 0 ? line.slice(0, colon) : line;
  if (label.length > MAX_HEADING_CHARS) return null;
  const explicit = line.startsWith("#") || line.endsWith(":") || line === line.toUpperCase();
  const words = label.split(/\s+/).length;
  const looksLikeHeading =
    explicit ||
    (colon > 0 ? words <= MAX_HEADING_WORDS + 1 : !namesKeyword && words <= MAX_HEADING_WORDS);
  if (!looksLikeHeading) return null;
  if (NICE_PATTERN.test(label)) return "nice";
  if (REQUIRED_HEADING.test(label)) return "required";
  if (CORE_HEADING.test(label)) return "core";
  if (OTHER_HEADING.test(label)) return "other";
  return null;
}

function lineWeight(line: string, zone: Zone, lineIndex: number): number {
  let weight = ZONE_WEIGHT[zone];
  if (NICE_PATTERN.test(line)) weight = ZONE_WEIGHT.nice;
  else if (REQUIRED_INLINE.test(line)) weight = Math.max(weight, ZONE_WEIGHT.required);
  // The first lines are usually the job title.
  return lineIndex < 2 ? weight * 1.25 : weight;
}

interface KeywordStats {
  keyword: Keyword;
  count: number;
  bestLineWeight: number;
  firstSeen: number;
}

const round1 = (value: number) => Math.max(0.1, Math.round(value * 10) / 10);

function keywordWeight(stats: KeywordStats): number {
  const frequency = 1 + 0.25 * Math.min(stats.count - 1, 4);
  return round1(KIND_WEIGHT[stats.keyword.kind] * stats.bestLineWeight * frequency);
}

/**
 * Keywords in a job description, most important first. Weight grows with
 * how often a keyword appears and where: requirement sections and "must"
 * lines count more, "nice to have" lines less. Linear in the text length.
 */
export function extractJobKeywords(jobDescription: string): JobKeyword[] {
  const text = jobDescription.slice(0, MAX_JOB_DESCRIPTION_CHARS);
  const stats = new Map<string, KeywordStats>();
  let zone: Zone = "neutral";
  let lineIndex = 0;
  let seen = 0;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const found: Keyword[] = [];
    scanKeywords(tokenize(line), (keyword) => found.push(keyword));
    zone = headingZone(line, found.length > 0) ?? zone;
    const weight = lineWeight(line, zone, lineIndex++);
    for (const keyword of found) {
      const entry = stats.get(keyword.id);
      if (entry) {
        entry.count++;
        entry.bestLineWeight = Math.max(entry.bestLineWeight, weight);
      } else {
        stats.set(keyword.id, { keyword, count: 1, bestLineWeight: weight, firstSeen: seen++ });
      }
    }
  }

  const keywords = [...stats.values()]
    .map((entry) => ({ entry, weight: keywordWeight(entry) }))
    .sort((a, b) => b.weight - a.weight || a.entry.firstSeen - b.entry.firstSeen)
    .slice(0, MAX_KEYWORDS)
    .map(({ entry, weight }) => ({
      id: entry.keyword.id,
      keyword: entry.keyword.label,
      kind: entry.keyword.kind,
      weight,
      fromLexicon: true,
    }));

  return keywords.length >= MIN_LEXICON_KEYWORDS
    ? keywords
    : [...keywords, ...frequentTerms(text)];
}

/* ── Fallback for adverts with few known keywords ─────────────────── */

/** Common English and job-advert words that are never useful keywords. */
const STOPWORDS: ReadonlySet<string> = new Set(
  `about above across after again against along among apply applicants application applications
  based being below benefits between bonus build building business candidate candidates career
  challenges change clients closely company could culture customer customers daily deliver
  delivering develop developer developers developing development diverse diversity doing during
  employer employees engineer engineers engineering environment equal every excellent exciting
  experience experienced first flexible following friendly great growing growth having helping
  highly holiday hours hybrid ideal impact improve including inclusive individuals interview join
  junior knowledge least level looking london making manager members mission month months needs
  offer office opportunities opportunity other others people please position preferred products
  product project projects provide quality range really remote required requirements responsible
  responsibilities salary senior should skills software solutions strong success support systems
  their there these thing things those through today together tools under understanding until
  using value values various where which while within without working world would years yourself`
    .split(/\s+/)
    .filter(Boolean),
);

/** Repeated, non-trivial words (≥5 letters, ≥2 occurrences) that the lexicon doesn't cover. */
function frequentTerms(text: string): JobKeyword[] {
  const counts = new Map<string, number>();
  for (const { norm } of tokenize(text)) {
    if (norm.length < 5 || !/^[a-z]+$/.test(norm)) continue;
    if (STOPWORDS.has(norm) || LEXICON.has(norm)) continue;
    counts.set(norm, (counts.get(norm) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_FALLBACK_TERMS)
    .map(([word, count]) => ({
      id: `w:${word}`,
      keyword: word,
      kind: "practice" as const,
      weight: round1(FALLBACK_WEIGHT * (1 + 0.25 * Math.min(count - 1, 4))),
      fromLexicon: false,
    }));
}
