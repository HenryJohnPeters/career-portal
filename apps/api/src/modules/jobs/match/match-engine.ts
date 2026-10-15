import { runAtsChecks, type AtsCheck } from "./ats-checks";
import { extractJobKeywords, type JobKeyword } from "./job-keywords";
import { scanKeywords, type KeywordKind } from "./lexicon";
import { toSectionType } from "../../cv/cv.rules";
import type { MatchCv, MatchCvSection } from "./match.types";
import { tokenize } from "./tokenize";

export interface MatchedKeyword {
  keyword: string;
  weight: number;
  /** Titles of the CV sections the keyword appears in. */
  foundIn: string[];
}

export interface MissingKeyword {
  keyword: string;
  weight: number;
  /** Title of the CV section to add it to (the user's own title when they have one). */
  suggestedSection: string;
}

export interface KeywordMatch {
  /** 0-100: weighted share of the job's keywords found in the CV. */
  score: number;
  matchedKeywords: MatchedKeyword[];
  missingKeywords: MissingKeyword[];
  atsChecks: AtsCheck[];
}

/** CV text read per match; a long two-page CV is around 10k characters. */
export const MAX_CV_CHARS = 60_000;
const MAX_CV_SECTIONS = 30;

const DEFAULT_TITLES: Readonly<Record<string, string>> = {
  profile: "Profile",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  languages: "Languages",
  interests: "Interests",
  custom: "Other",
};

/** Where a missing keyword of each kind is best demonstrated. */
const SECTION_FOR_KIND: Readonly<Record<KeywordKind, string>> = {
  tech: "skills",
  practice: "experience",
  soft: "experience",
  role: "profile",
};

interface IndexedSection {
  title: string;
  keywordIds: ReadonlySet<string>;
  words: ReadonlySet<string>;
}

function titleOf(section: MatchCvSection): string {
  const title = section.title.trim();
  return title || DEFAULT_TITLES[toSectionType(section.sectionType)];
}

/** Keywords and words per CV section, within the size budget. */
function indexSections(cv: MatchCv): IndexedSection[] {
  const indexed: IndexedSection[] = [];
  let budget = MAX_CV_CHARS;
  for (const section of cv.sections.slice(0, MAX_CV_SECTIONS)) {
    if (budget <= 0) break;
    const text = `${section.title}\n${section.content}`.slice(0, budget);
    budget -= text.length;
    const tokens = tokenize(text);
    const keywordIds = new Set<string>();
    scanKeywords(tokens, (keyword) => keywordIds.add(keyword.id));
    indexed.push({
      title: titleOf(section),
      keywordIds,
      words: new Set(tokens.map((token) => token.norm)),
    });
  }
  return indexed;
}

function sectionHas(section: IndexedSection, keyword: JobKeyword): boolean {
  if (keyword.fromLexicon) return section.keywordIds.has(keyword.id);
  // Frequent-word keywords: the word itself or its simple plural/singular.
  const word = keyword.keyword;
  return (
    section.words.has(word) ||
    section.words.has(`${word}s`) ||
    (word.endsWith("s") && section.words.has(word.slice(0, -1)))
  );
}

function suggestedSection(kind: KeywordKind, cv: MatchCv): string {
  const type = SECTION_FOR_KIND[kind];
  const own = cv.sections.find(
    (s) => toSectionType(s.sectionType) === type && s.title.trim(),
  );
  return own ? own.title.trim() : DEFAULT_TITLES[type];
}

/**
 * Deterministic keyword match between a CV and a job description (no AI).
 * Linear in the size of both texts, which are capped.
 */
export function matchCvToJobDescription(cv: MatchCv, jobDescription: string): KeywordMatch {
  const keywords = extractJobKeywords(jobDescription);
  const sections = indexSections(cv);

  const matchedKeywords: MatchedKeyword[] = [];
  const missingKeywords: MissingKeyword[] = [];
  let total = 0;
  let found = 0;
  for (const keyword of keywords) {
    total += keyword.weight;
    const foundIn = [
      ...new Set(sections.filter((s) => sectionHas(s, keyword)).map((s) => s.title)),
    ];
    if (foundIn.length > 0) {
      found += keyword.weight;
      matchedKeywords.push({ keyword: keyword.keyword, weight: keyword.weight, foundIn });
    } else {
      missingKeywords.push({
        keyword: keyword.keyword,
        weight: keyword.weight,
        suggestedSection: suggestedSection(keyword.kind, cv),
      });
    }
  }

  return {
    score: total > 0 ? Math.round((100 * found) / total) : 0,
    matchedKeywords,
    missingKeywords,
    atsChecks: runAtsChecks(cv),
  };
}
