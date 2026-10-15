// === API envelope & error contract (PLAN §2.1) ===
// Mirrored on the API in apps/api/src/common/errors.ts.

/** Every successful JSON response is wrapped as `{ data }`. */
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/** A metered allowance that can run out on the free plan. */
export type QuotaKey =
  | "aiActions"
  | "cvVersions"
  | "coverLetters"
  | "mockSessions"
  | "questions"
  | "techTests";

/** A capability that only Premium unlocks. */
export type PremiumFeature =
  | "templates"
  | "interviewers"
  | "tailorKit"
  | "insights"
  | "aiTechReview"
  | "progressBreakdown"
  | "aiQuestionGeneration";

/** HTTP 403 — a free-plan allowance is used up. */
export interface QuotaExceededDetails {
  reason: "quota_exceeded";
  quota: QuotaKey;
  limit: number;
  used: number;
  /** ISO date the allowance resets; null when it is not time-based (e.g. CV versions). */
  resetsAt: string | null;
}

/** HTTP 403 — the feature is part of Premium. */
export interface PremiumRequiredDetails {
  reason: "premium_required";
  feature: PremiumFeature;
}

/** HTTP 429 (+ Retry-After header) — premium fair-use cap reached. */
export interface FairUseLimitDetails {
  reason: "fair_use_limit";
  retryAfterSeconds: number;
}

/** HTTP 429 — short per-user cooldown between repeated actions. */
export interface CooldownDetails {
  reason: "cooldown";
  retryAfterSeconds: number;
}

export type ApiErrorDetails =
  | QuotaExceededDetails
  | PremiumRequiredDetails
  | FairUseLimitDetails
  | CooldownDetails;

export type ApiErrorReason = ApiErrorDetails["reason"];

/** JSON body of every API error response (see HttpExceptionFilter). */
export interface ApiErrorBody {
  code: number;
  message: string;
  details?: ApiErrorDetails;
  timestamp: string;
}
