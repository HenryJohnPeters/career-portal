import type { ModelTier } from "../../common/plan";
import type { LegacyAiUsageStatus } from "../entitlements/entitlements.types";

/*
 * Types for the AI module's public API. The API cannot import
 * libs/shared/types, so shapes the web also uses (AiFullCvResult,
 * JobDescriptionAnalysis, TechTestAiReview) are mirrored here; keep them in sync.
 */

/* ── Usage / reservations ─────────────────────────────────────────── */

/** Legacy `GET /auth/ai-usage` payload. */
export type AiUsageStatus = LegacyAiUsageStatus;

export interface AiTokenUsage {
  promptTokens: number;
  completionTokens: number;
}

/** What a reservation's `work` callback receives. */
export interface AiCallContext {
  /** Model for this user's tier (free: light, premium: standard). */
  model: string;
  modelTier: ModelTier;
  isPremium: boolean;
  /** Report token counts of a completed (billed) call; summed across calls. */
  recordTokens(usage: AiTokenUsage): void;
}

export interface AiReservationOptions {
  /** Usage units to reserve (1..3); the tailor kit with a letter takes 2. */
  units?: number;
}

export interface AiReservation {
  usageIds: string[];
  model: string;
  modelTier: ModelTier;
  isPremium: boolean;
}

export interface AiUsageTelemetry {
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
}

/* ── Shared request pieces ────────────────────────────────────────── */

export type AiWritingAction = "generate" | "improve" | "tailor";
export type AiCvAction = AiWritingAction;

/** A CV section used as context or as tailoring input. */
export interface AiContextSection {
  title: string;
  sectionType: string;
  content: string;
}

/** Text output that replaces user content. */
export interface AiTextResult {
  content: string;
  /** True when the input exceeded the AI limit and was cut, so the output may miss the end. */
  truncated: boolean;
}

/* ── CV ───────────────────────────────────────────────────────────── */

export interface AiCvSectionRequest {
  action: AiWritingAction;
  sectionType: string;
  sectionTitle: string;
  /** Editor text (preferred) or the saved section content. */
  currentContent?: string;
  jobTitle?: string;
  jobDescription?: string;
  /** The version's other sections, as context. */
  allSections?: AiContextSection[];
}

export interface AiFullCvFromTextRequest {
  rawText: string;
  jobTitle?: string;
  jobDescription?: string;
  userName?: string;
}

export interface AiFullCvSection {
  title: string;
  /** One of the CV SectionType values. */
  sectionType: string;
  content: string;
}

export interface AiFullCvResult {
  name: string;
  email: string;
  phone: string;
  location: string;
  /** Normalised to an http(s) URL, or "" when missing/invalid. */
  website: string;
  linkedin: string;
  github: string;
  sections: AiFullCvSection[];
}

/* ── Cover letters ────────────────────────────────────────────────── */

export type CoverLetterTone = "professional" | "friendly";

export interface AiCoverLetterRequest {
  action: AiWritingAction;
  /** Editor text (preferred) or the saved body. Required for improve/tailor. */
  currentBody?: string;
  jobTitle?: string;
  companyName?: string;
  companyUrl?: string;
  jobDescription?: string;
  cvSections?: AiContextSection[];
  /** false = never send CV data, even if cvSections are passed. Default true. */
  useCv?: boolean;
  userName?: string;
  tone?: CoverLetterTone;
}

export interface AiCoverLetterSuggestRequest {
  body: string;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
}

export interface AiCoverLetterRewriteRequest {
  body: string;
  tone: CoverLetterTone;
  jobTitle?: string;
  companyName?: string;
}

/* ── Jobs ─────────────────────────────────────────────────────────── */

export type JobSeniority = "junior" | "mid" | "senior" | "lead";

export interface JobDescriptionAnalysis {
  company: string | null;
  role: string | null;
  location: string | null;
  salary: string | null;
  seniority: JobSeniority | null;
  keySkills: string[];
  niceToHave: string[];
  summary: string;
}

export type TailorTone = "professional" | "enthusiastic" | "concise";

export interface TailorApplicationInput {
  company: string;
  role: string;
  jobDescription: string;
  userName: string;
  /** "professional" (default) | "enthusiastic" | "concise". */
  tone?: string;
  /** All sections of the base CV; profile/experience/skills are tailored, the rest are context. */
  sections: { id: string; title: string; sectionType: string; content: string }[];
  includeCoverLetter: boolean;
}

export interface TailorApplicationOutput {
  /** Tailored content keyed by input section id. Sections not listed keep their original content. */
  sections: { id: string; content: string }[];
  coverLetter: string | null;
}

/* ── Technical tests ──────────────────────────────────────────────── */

export type TechTestRating = 0 | 1 | 2 | 3;

export interface TechTestReviewInput {
  title: string;
  brief: string;
  requirements: string[];
  /** Criterion names (optionally "name — description"); the review scores each one. */
  evaluationCriteria: string[];
  level: string;
  submission: string;
}

/** `TechTestAiReview` without `reviewedAt` (the caller stamps it when storing). */
export interface TechTestAiReviewResult {
  summary: string;
  strengths: string[];
  improvements: string[];
  criteria: { criterion: string; score: TechTestRating; comment: string }[];
}

export interface ScenarioGenerationInput {
  roleFocus: string;
  level: string;
  difficulty: string;
  tags: string[];
}

/* ── Interview question bank ──────────────────────────────────────── */

export interface QuestionGenerationFilters {
  track: string;
  level: string;
  difficulty: string;
  tags: string[];
}

export type PoolFillSkipReason =
  | "not_premium"
  | "invalid_filters"
  | "pool_sufficient"
  | "cooldown"
  | "user_daily_cap"
  | "global_daily_budget"
  | "failed";

export interface PoolFillResult {
  /** Questions added to the shared bank by this call. */
  generated: number;
  /** Why nothing (or nothing more) was generated; null when a batch was generated. */
  skipped: PoolFillSkipReason | null;
}
