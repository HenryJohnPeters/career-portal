/**
 * Automated checklist for a submitted take-home ("self-check").
 *
 * It only measures which requirements and rubric topics a write-up MENTIONS
 * (whole-word, lightly stemmed matching), so it is labelled as checklist
 * coverage, never as a grade of quality. Signals are computed once per
 * submission; padding past SUBSTANCE_WORDS earns nothing, and symbols or
 * stop words in criterion names never count as hits.
 */
import { clampScore, computeGrade, toPercentage } from "../../../common/grade.util";

export interface ChecklistScenario {
  requirements: readonly { key: string; text: string }[];
  evaluationCriteria: readonly { name: string; weight: number; description?: string }[];
}

/** Stored as `TechnicalTest.evaluation` (plus selfReview / aiReview later). */
export interface SubmissionEvaluation {
  overallScore: number;
  maxPossible: number;
  /** Checklist coverage, 0-100. */
  percentage: number;
  grade: string;
  criteriaScores: { name: string; score: number; maxScore: number; description: string }[];
  strengths: string[];
  improvements: string[];
  requirementsCovered: number;
  requirementsTotal: number;
  requirementsMissed: string[];
  wordCount: number;
  summary: string;
}

/** Shorter write-ups get proportionally less credit; longer ones gain nothing extra. */
export const SUBSTANCE_WORDS = 120;
/** Share of a requirement's distinctive terms that counts as mentioning it. */
const REQUIREMENT_TERM_SHARE = 0.4;
/** Distinct rubric terms needed for full credit on one criterion. */
const CRITERION_TERMS_NEEDED = 3;
/** Distinctive terms considered per requirement. */
const MAX_REQUIREMENT_TERMS = 12;
/** Per-criterion mix: its own rubric topics vs. the brief's requirements. */
const TOPIC_SHARE = 0.6;

const STOP_WORDS = new Set(
  (
    "a an the and or nor of to in on for with by at as is are was were be been being it its " +
    "this that these those from into onto via per up out over under about than then so such " +
    "use uses using used should must can could may might will would shall each every all any " +
    "some least most more less one two three own their there they them your you we our us " +
    "user users e g eg etc ie implement implements create creates build builds add adds " +
    "include includes including support supports make makes ensure ensures proper properly " +
    "clear clearly appropriate simple basic full fully new also only not no without when " +
    "after before like well between multiple other others based way which what how has have " +
    "had provide provides allow allows do does done get gets set sets need needs at"
  ).split(" "),
);

const SIGNALS = {
  testing: ["test", "tests", "testing", "unit", "integration", "e2e", "jest", "vitest", "pytest", "cypress", "playwright", "spec", "coverage", "mock"],
  reasoning: ["tradeoff", "tradeoffs", "trade", "because", "chose", "chosen", "decision", "decided", "alternative", "alternatives", "instead", "rationale", "why"],
  errors: ["error", "errors", "exception", "exceptions", "validation", "validate", "edge", "retry", "retries", "fallback", "timeout", "failure", "fail"],
} as const;

/** Light suffix stripping so "caching"/"cached"/"cache" or "tests"/"testing" match. */
export function stem(word: string): string {
  let w = word;
  const strip = (suffix: string, replacement = ""): boolean => {
    if (w.length - suffix.length < 3 || !w.endsWith(suffix)) return false;
    w = w.slice(0, -suffix.length) + replacement;
    return true;
  };
  if (!strip("ies", "y") && !strip("ations", "ate") && !strip("ation", "ate")) {
    if (!strip("ions") && !strip("ion") && !strip("ing") && !strip("ed")) {
      if (/(?:s|x|z|ch|sh)es$/.test(w)) strip("es");
      else if (!/(?:ss|us|is)$/.test(w)) strip("s");
    }
  }
  if (/([bdgklmnprt])\1$/.test(w) && w.length > 3) w = w.slice(0, -1);
  if (w.length > 3 && w.endsWith("e")) w = w.slice(0, -1);
  return w;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9+#]+/).filter(Boolean);
}

/** Unique stems of the distinctive (non-stop-word, non-numeric) words in `text`. */
function distinctiveTerms(text: string, max = Infinity): string[] {
  const out: string[] = [];
  for (const token of tokenize(text)) {
    if (token.length < 2 || STOP_WORDS.has(token) || /^\d+$/.test(token)) continue;
    const term = stem(token);
    if (!out.includes(term)) out.push(term);
    if (out.length >= max) break;
  }
  return out;
}

interface SubmissionText {
  /** Every token, stemmed, in order (for matching multi-word requirement keys). */
  stems: string[];
  /** Stems of distinctive words only, so "them" never matches "theming". */
  stemSet: ReadonlySet<string>;
}

function analyse(submission: string): SubmissionText {
  const tokens = tokenize(submission);
  const stemSet = new Set<string>();
  for (const token of tokens) {
    if (!STOP_WORDS.has(token)) stemSet.add(stem(token));
  }
  return { stems: tokens.map(stem), stemSet };
}

function containsSequence(haystack: readonly string[], needle: readonly string[]): boolean {
  if (needle.length === 0) return false;
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

function mentionsRequirement(
  text: SubmissionText,
  requirement: { key: string; text: string },
): boolean {
  const keyStems = tokenize(requirement.key).map(stem);
  if (containsSequence(text.stems, keyStems)) return true;
  const terms = distinctiveTerms(requirement.text, MAX_REQUIREMENT_TERMS);
  if (terms.length === 0) return false;
  const hits = terms.filter((t) => text.stemSet.has(t)).length;
  const needed = terms.length < 3 ? terms.length : Math.ceil(terms.length * REQUIREMENT_TERM_SHARE);
  return hits >= needed;
}

function criterionCoverage(
  text: SubmissionText,
  criterion: { name: string; description?: string },
): number | null {
  const terms = distinctiveTerms(`${criterion.name} ${criterion.description ?? ""}`);
  if (terms.length === 0) return null;
  const hits = terms.filter((t) => text.stemSet.has(t)).length;
  return Math.min(1, hits / Math.min(CRITERION_TERMS_NEEDED, terms.length));
}

function hasSignal(text: SubmissionText, words: readonly string[]): boolean {
  return words.some((word) => text.stemSet.has(stem(word)));
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function evaluateSubmission(
  submission: string,
  scenario: ChecklistScenario,
): SubmissionEvaluation {
  const text = analyse(submission);
  const wordCount = submission.split(/\s+/).filter(Boolean).length;
  const substance = Math.min(1, wordCount / SUBSTANCE_WORDS);

  const requirements = scenario.requirements ?? [];
  const missed = requirements.filter((r) => !mentionsRequirement(text, r)).map((r) => r.key);
  const covered = requirements.length - missed.length;
  const requirementCoverage = requirements.length > 0 ? covered / requirements.length : null;

  const criteriaScores = (scenario.evaluationCriteria ?? []).map((criterion) => {
    const maxScore = Number.isFinite(criterion.weight) ? Math.max(0, criterion.weight) : 0;
    const topic = criterionCoverage(text, criterion);
    const coverage =
      topic === null
        ? (requirementCoverage ?? 0)
        : requirementCoverage === null
          ? topic
          : TOPIC_SHARE * topic + (1 - TOPIC_SHARE) * requirementCoverage;
    return {
      name: criterion.name,
      score: round1(clampScore(maxScore * substance * coverage, maxScore)),
      maxScore,
      description: criterion.description ?? "",
    };
  });

  const overallScore = round1(criteriaScores.reduce((sum, c) => sum + c.score, 0));
  const maxPossible = criteriaScores.reduce((sum, c) => sum + c.maxScore, 0);
  const percentage = toPercentage(overallScore, maxPossible);

  const hasCode = /```/.test(submission);
  const mentionsTesting = hasSignal(text, SIGNALS.testing);
  const explainsReasoning = hasSignal(text, SIGNALS.reasoning);
  const coversErrors = hasSignal(text, SIGNALS.errors);

  const strengths: string[] = [];
  const improvements: string[] = [];
  if (requirements.length > 0 && missed.length === 0) {
    strengths.push("Mentions every requirement in the brief.");
  }
  if (wordCount < SUBSTANCE_WORDS) {
    improvements.push(
      "The write-up is short — explain your approach, the key implementation details and your reasoning.",
    );
  }
  (hasCode ? strengths : improvements).push(
    hasCode
      ? "Includes code that shows how the solution works."
      : "Add the key code (in ``` fenced blocks) to show how you'd implement it.",
  );
  (mentionsTesting ? strengths : improvements).push(
    mentionsTesting
      ? "Describes how the solution is tested."
      : "Describe your testing strategy — what you'd test and how.",
  );
  (explainsReasoning ? strengths : improvements).push(
    explainsReasoning
      ? "Explains the reasoning or trade-offs behind decisions."
      : "Explain why you made your main choices and what you traded off.",
  );
  (coversErrors ? strengths : improvements).push(
    coversErrors
      ? "Covers error handling or edge cases."
      : "Say how the solution handles errors and edge cases.",
  );

  const requirementText =
    requirements.length > 0
      ? `Your write-up mentions ${covered} of ${requirements.length} requirements`
      : "Your write-up was checked against the rubric";
  return {
    overallScore,
    maxPossible,
    percentage,
    grade: computeGrade(percentage),
    criteriaScores,
    strengths,
    improvements,
    requirementsCovered: covered,
    requirementsTotal: requirements.length,
    requirementsMissed: missed,
    wordCount,
    summary: `${requirementText} and covers ${percentage}% of the checklist. This automated keyword check shows what your solution mentions, not how good it is — use it as a prompt for your self-review.`,
  };
}
