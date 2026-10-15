/**
 * Input caps for AI prompts.
 *
 * Text that the AI rewrites (improve / tailor / rewrite / full CV) is capped at
 * the DTO limit, never below it: the output replaces the user's text, so a cut
 * input would silently lose content. Context-only text (job descriptions, other
 * CV sections) is truncated with an explicit marker.
 */
export const AI_INPUT_LIMITS = {
  /** CV section text (= CV_LIMITS.sectionContent). */
  sectionContent: 15_000,
  /** Cover-letter body (= cover-letter DTO limit). */
  coverLetterBody: 15_000,
  /** Full-CV brain dump (= AiGenerateFullCvDto.rawText limit). */
  rawText: 20_000,
  /** Job description used as context for CV and cover-letter writing. */
  jobDescriptionContext: 10_000,
  /** Job description sent to the analyser (= Job.jobDescription limit). */
  jobDescriptionAnalysis: 20_000,
  /** Other CV sections sent as context: count, per-section and total chars. */
  contextSections: 10,
  contextSectionChars: 1_500,
  contextTotalChars: 6_000,
  /** Total CV text the tailor kit rewrites in one call. */
  tailorTotalChars: 30_000,
  /** Single-line fields: titles, names, company, role. */
  shortText: 200,
  url: 500,
  /** Tech-test brief and submission sent for AI review. */
  brief: 6_000,
  submission: 30_000,
} as const;

/**
 * Per-call OpenAI options. Long generations never retry automatically, so a
 * slow completion is never paid for twice; both stay under the web client's
 * 120s AI timeout.
 */
export const AI_CALL_PROFILES = {
  short: { timeout: 45_000, maxRetries: 1 },
  long: { timeout: 90_000, maxRetries: 0 },
} as const;

export type AiCallProfile = keyof typeof AI_CALL_PROFILES;

/** User-facing messages. 5xx messages are shown verbatim by the error filter. */
export const AI_ERROR_MESSAGES = {
  unavailable: "The AI service is temporarily unavailable. Please try again.",
  invalidOutput: "The AI returned an unexpected response. Please try again.",
  rejected:
    "The AI couldn't process this request. Try shortening or rephrasing your text.",
  filtered:
    "The AI couldn't respond to this content. Please rephrase it and try again.",
} as const;

/** `AiUsage.action` values. */
export const AI_ACTIONS = {
  cvSection: "cv-section",
  cvFull: "cv-full",
  coverLetter: "cover-letter",
  coverLetterSuggest: "cover-letter-suggest",
  coverLetterRewrite: "cover-letter-rewrite",
  jobAnalyze: "job-analyze",
  tailorApplication: "tailor-application",
  techTestReview: "tech-test-review",
  scenarioGeneration: "scenario-generation",
} as const;

export type AiAction = (typeof AI_ACTIONS)[keyof typeof AI_ACTIONS];
