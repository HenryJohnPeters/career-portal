import type {
  ModelTier,
  PlanLimits,
  PlanName,
  UsageMeter,
} from "../../common/plan";

export type { ModelTier, PlanLimits, PlanName, UsageMeter };

/** Result of `EntitlementsService.getPlan`. */
export interface UserPlan {
  userId: string;
  plan: PlanName;
  isPremium: boolean;
  isTrialing: boolean;
  limits: PlanLimits;
  modelTier: ModelTier;
}

export interface PlanUsageMeters {
  aiActions: UsageMeter;
  mockSessions: UsageMeter;
  questions: UsageMeter;
  techTests: UsageMeter;
  cvVersions: UsageMeter;
  coverLetters: UsageMeter;
}

export interface FairUseStatus {
  aiActionsToday: number;
  dailyLimit: number;
  aiActionsThisMonth: number;
  monthlyLimit: number;
}

export interface PlanFeatures {
  allTemplates: boolean;
  allInterviewers: boolean;
  tailorKit: boolean;
  insights: boolean;
  aiTechReview: boolean;
  progressBreakdown: boolean;
  aiModel: ModelTier;
}

/** `GET /account/usage` payload (PLAN §2.2). */
export interface PlanUsage {
  plan: PlanName;
  isPremium: boolean;
  isTrialing: boolean;
  /** Next UTC month start (ISO). */
  periodResetsAt: string;
  meters: PlanUsageMeters;
  /** Premium only. */
  fairUse: FairUseStatus | null;
  features: PlanFeatures;
}

/** Legacy `GET /auth/ai-usage` shape, derived from `PlanUsage`. */
export interface LegacyAiUsageStatus {
  used: number;
  limit: number | null;
  remaining: number | null;
  isPremium: boolean;
  resetsAt: string;
  mockSessionsUsed: number;
  mockSessionsLimit: number | null;
  mockSessionsRemaining: number | null;
  questionsUsed: number;
  questionsLimit: number | null;
  questionsRemaining: number | null;
  techTestsUsed: number;
  techTestsLimit: number | null;
  techTestsRemaining: number | null;
}

/** AI usage counts used for quota, fair-use and attempt-cap checks. */
export interface AiUsageCounts {
  /** `succeeded` rows since the UTC month start. */
  succeededThisMonth: number;
  /** `succeeded` rows in the trailing 24h. */
  succeededLast24h: number;
  /** All rows (any status) in the trailing 24h. */
  attemptsLast24h: number;
}
