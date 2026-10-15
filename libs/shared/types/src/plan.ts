// === Plans, limits & usage (PLAN §1, §2.2) ===
// FREE_TIER, PREMIUM_FAIR_USE and AI_DAILY_ATTEMPT_CAP are mirrored in
// apps/api/src/common/constants.ts; apps/api/src/common/shared-mirror.spec.ts
// asserts the copies are identical, so change both together.
import type { AiModelTier } from "./ai";
import type { PlanName } from "./auth";
import type { PremiumFeature, QuotaKey } from "./errors";
import { TEMPLATE_OPTIONS } from "./cv-templates";

export const FREE_TIER = {
  /** Max CV versions (a master CV + one targeted CV) */
  cvVersions: 2,
  /** Max cover letters */
  coverLetters: 5,
  /** Monthly AI actions (light model) */
  monthlyAiActions: 10,
  /** Monthly mock interview sessions */
  monthlyMockSessions: 5,
  /** Monthly interview questions answered */
  monthlyQuestions: 75,
  /** Monthly technical tests created (deleted tests still count) */
  monthlyTechTests: 3,
  /** Interviewers available on the free plan (first N in the list) */
  interviewerCount: 3,
  /** Free template ids — gate by membership, never by list position */
  templateIds: [
    "classic",
    "modern",
    "minimal",
    "executive",
    "creative",
  ] as readonly string[],
} as const;

/** Premium AI is "Unlimited (fair use)"; exceeding either cap → 429 fair_use_limit. */
export const PREMIUM_FAIR_USE = {
  monthlyAiActions: 300,
  dailyAiActions: 40,
} as const;

/** Every AI attempt (succeeded + failed + pending) in a trailing 24h window. */
export const AI_DAILY_ATTEMPT_CAP = {
  free: 15,
  premium: 80,
} as const;

/** Display price. Must match the Stripe price configured as STRIPE_PRICE_ID. */
export const PREMIUM_PRICE = {
  amount: 9.99,
  currency: "GBP",
  interval: "month",
  label: "£9.99",
  perMonthLabel: "£9.99/mo",
} as const;

export function isFreeTemplate(templateId: string): boolean {
  return FREE_TIER.templateIds.includes(templateId);
}

// === Usage (GET /account/usage) ===

export interface UsageMeter {
  used: number;
  /** null = unlimited */
  limit: number | null;
  /** null = unlimited */
  remaining: number | null;
  /** null = not time-based (e.g. CV versions) */
  resetsAt: string | null;
}

export interface PlanFeatureFlags {
  allTemplates: boolean;
  allInterviewers: boolean;
  tailorKit: boolean;
  insights: boolean;
  aiTechReview: boolean;
  progressBreakdown: boolean;
  aiModel: AiModelTier;
}

export interface FairUseStatus {
  aiActionsToday: number;
  dailyLimit: number;
  aiActionsThisMonth: number;
  monthlyLimit: number;
}

export interface PlanUsage {
  plan: PlanName;
  isPremium: boolean;
  isTrialing: boolean;
  /** Next UTC month start. */
  periodResetsAt: string;
  meters: Record<QuotaKey, UsageMeter>;
  /** Premium only. */
  fairUse: FairUseStatus | null;
  features: PlanFeatureFlags;
}

/** True when a metered allowance is used up (never for unlimited meters). */
export function isMeterExhausted(meter: UsageMeter | null | undefined): boolean {
  return !!meter && meter.limit !== null && meter.used >= meter.limit;
}

/** 0-100 share of a limited meter that is used; null for unlimited meters. */
export function meterPercent(meter: UsageMeter | null | undefined): number | null {
  if (!meter || meter.limit === null) return null;
  if (meter.limit <= 0) return 100;
  return Math.min(100, Math.round((meter.used / meter.limit) * 100));
}

/** Plural nouns for quota copy ("You've used 10/10 AI actions"). */
export const QUOTA_LABELS: Readonly<Record<QuotaKey, string>> = {
  aiActions: "AI actions",
  cvVersions: "CV versions",
  coverLetters: "cover letters",
  mockSessions: "mock interview sessions",
  questions: "practice questions",
  techTests: "technical tests",
};

/** Display names for premium-only capabilities. */
export const PREMIUM_FEATURE_LABELS: Readonly<Record<PremiumFeature, string>> = {
  templates: "All CV templates",
  interviewers: "All interviewers",
  tailorKit: "Tailor-for-this-job kit",
  insights: "Full application insights",
  aiTechReview: "AI review of take-home tests",
  progressBreakdown: "Full interview progress breakdown",
  aiQuestionGeneration: "AI-generated interview questions",
};

// === Plan comparison (Landing / Register / Billing) ===

export type PlanFeatureKey =
  | "jobTracker"
  | "cvVersions"
  | "templates"
  | "pdfExport"
  | "coverLetters"
  | "cvMatch"
  | "aiActions"
  | "aiModel"
  | "tailorKit"
  | "insights"
  | "mockInterviews"
  | "questions"
  | "interviewers"
  | "interviewProgress"
  | "techTests"
  | "aiTechReview"
  | "dataExport";

export interface PlanFeatureRow {
  key: PlanFeatureKey;
  label: string;
  /** `true`/`false` render as included/not included; strings are shown as-is. */
  free: string | boolean;
  premium: string | boolean;
  /** Footnote, e.g. fair-use limits. */
  note?: string;
}

const perMonth = (n: number) => `${n} / month`;

/**
 * Single source for every plan comparison. Values are derived from the
 * enforced limits above, so marketing copy cannot drift from enforcement.
 */
export const PLAN_FEATURES: readonly PlanFeatureRow[] = [
  {
    key: "jobTracker",
    label: "Job application tracker",
    free: "Unlimited",
    premium: "Unlimited",
  },
  {
    key: "cvVersions",
    label: "CV versions",
    free: String(FREE_TIER.cvVersions),
    premium: "Unlimited",
  },
  {
    key: "templates",
    label: "CV templates",
    free: String(FREE_TIER.templateIds.length),
    premium: `All ${TEMPLATE_OPTIONS.length}`,
  },
  {
    key: "pdfExport",
    label: "PDF downloads (CV & cover letter, no watermark)",
    free: "Unlimited",
    premium: "Unlimited",
  },
  {
    key: "coverLetters",
    label: "Cover letters",
    free: String(FREE_TIER.coverLetters),
    premium: "Unlimited",
  },
  {
    key: "cvMatch",
    label: "CV-to-job keyword match score",
    free: true,
    premium: true,
  },
  {
    key: "aiActions",
    label: "AI writing & job-description analysis",
    free: perMonth(FREE_TIER.monthlyAiActions),
    premium: "Unlimited (fair use)",
    note: `Fair use: up to ${PREMIUM_FAIR_USE.dailyAiActions} AI actions a day and ${PREMIUM_FAIR_USE.monthlyAiActions} a month.`,
  },
  {
    key: "aiModel",
    label: "AI model",
    free: "Fast model",
    premium: "Higher-quality model",
  },
  {
    key: "tailorKit",
    label: "Tailor-for-this-job kit (tailored CV + cover letter)",
    free: false,
    premium: true,
  },
  {
    key: "insights",
    label: "Application insights",
    free: "Funnel & response rates",
    premium: "Plus which CV gets the most responses",
  },
  {
    key: "mockInterviews",
    label: "Mock interview sessions",
    free: perMonth(FREE_TIER.monthlyMockSessions),
    premium: "Unlimited",
  },
  {
    key: "questions",
    label: "Interview questions answered",
    free: perMonth(FREE_TIER.monthlyQuestions),
    premium: "Unlimited",
  },
  {
    key: "interviewers",
    label: "Interviewer personalities",
    free: String(FREE_TIER.interviewerCount),
    premium: "All",
  },
  {
    key: "interviewProgress",
    label: "Interview progress tracking",
    free: "Overall score + top 3 weak topics",
    premium: "Full topic breakdown + weekly trend",
  },
  {
    key: "techTests",
    label: "Take-home technical tests with self-review",
    free: perMonth(FREE_TIER.monthlyTechTests),
    premium: "Unlimited",
  },
  {
    key: "aiTechReview",
    label: "AI review of take-home submissions",
    free: false,
    premium: true,
  },
  {
    key: "dataExport",
    label: "Export or delete all your data",
    free: true,
    premium: true,
  },
];
