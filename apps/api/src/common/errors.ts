import { HttpException, HttpStatus } from "@nestjs/common";

/*
 * Shared error contract (PLAN §2.1). The global HttpExceptionFilter serialises
 * these as `{ code, message, details, timestamp }` so the web client can show a
 * contextual upgrade prompt or retry hint. Keep these types in sync with
 * `libs/shared/types` (the web-side copies).
 */

export type QuotaKey =
  | "aiActions"
  | "cvVersions"
  | "coverLetters"
  | "mockSessions"
  | "questions"
  | "techTests";

export type PremiumFeature =
  | "templates"
  | "interviewers"
  | "tailorKit"
  | "insights"
  | "aiTechReview"
  | "progressBreakdown"
  | "aiQuestionGeneration";

export type ApiErrorDetails =
  | {
      reason: "quota_exceeded";
      quota: QuotaKey;
      limit: number;
      used: number;
      resetsAt: string | null;
    }
  | { reason: "premium_required"; feature: PremiumFeature }
  | { reason: "fair_use_limit"; retryAfterSeconds: number }
  | { reason: "cooldown"; retryAfterSeconds: number };

const QUOTA_NOUNS: Record<QuotaKey, string> = {
  aiActions: "AI actions",
  cvVersions: "CV versions",
  coverLetters: "cover letters",
  mockSessions: "mock interview sessions",
  questions: "practice questions",
  techTests: "technical tests",
};

const FEATURE_NAMES: Record<PremiumFeature, string> = {
  templates: "This template",
  interviewers: "This interviewer",
  tailorKit: "Tailor-for-this-job",
  insights: "Full application insights",
  aiTechReview: "AI review of technical tests",
  progressBreakdown: "The full progress breakdown",
  aiQuestionGeneration: "AI question generation",
};

function toIso(value: Date | string | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function wholeSeconds(seconds: number): number {
  return Math.max(1, Math.ceil(seconds));
}

/** 403 — a free-plan allowance is used up. `resetsAt` null = not time-based. */
export class QuotaExceededException extends HttpException {
  constructor(
    quota: QuotaKey,
    limit: number,
    used: number,
    resetsAt: Date | string | null,
    message?: string,
  ) {
    const noun = QUOTA_NOUNS[quota];
    const defaultMessage =
      resetsAt === null
        ? `The free plan includes up to ${limit} ${noun}. Upgrade to Premium for unlimited ${noun}.`
        : `You've used all ${limit} ${noun} included in the free plan this month. Upgrade to Premium for more.`;
    const details: ApiErrorDetails = {
      reason: "quota_exceeded",
      quota,
      limit,
      used,
      resetsAt: toIso(resetsAt),
    };
    super({ message: message ?? defaultMessage, details }, HttpStatus.FORBIDDEN);
  }
}

/** 403 — the feature is part of Premium. */
export class PremiumRequiredException extends HttpException {
  constructor(feature: PremiumFeature, message?: string) {
    const details: ApiErrorDetails = { reason: "premium_required", feature };
    super(
      {
        message:
          message ??
          `${FEATURE_NAMES[feature]} is available on Premium. Upgrade to unlock it.`,
        details,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

/** 429 — premium fair-use cap reached. The filter adds a Retry-After header. */
export class FairUseLimitException extends HttpException {
  constructor(retryAfterSeconds: number, message?: string) {
    const details: ApiErrorDetails = {
      reason: "fair_use_limit",
      retryAfterSeconds: wholeSeconds(retryAfterSeconds),
    };
    super(
      {
        message:
          message ??
          "You've reached the fair-use limit for AI actions. Please try again later.",
        details,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/** 429 — short per-user cooldown between repeated actions. */
export class CooldownException extends HttpException {
  constructor(retryAfterSeconds: number, message?: string) {
    const details: ApiErrorDetails = {
      reason: "cooldown",
      retryAfterSeconds: wholeSeconds(retryAfterSeconds),
    };
    super(
      {
        message:
          message ?? "Please wait a moment before trying that again.",
        details,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
