// === AI ===

export type AiModelTier = "light" | "standard";

export type AiWritingAction = "generate" | "improve" | "tailor";

/**
 * GET /auth/ai-usage — legacy usage shape kept for older callers.
 * New code should use `PlanUsage` (GET /account/usage).
 */
export interface AiUsageStatus {
  used: number;
  limit: number | null; // null = unlimited (premium)
  remaining: number | null; // null = unlimited
  isPremium: boolean;
  resetsAt: string; // ISO date of next month start
  /** Monthly mock session usage (interview prep) */
  mockSessionsUsed: number;
  mockSessionsLimit: number | null;
  mockSessionsRemaining: number | null;
  /** Monthly question answer usage (interview prep) */
  questionsUsed: number;
  questionsLimit: number | null;
  questionsRemaining: number | null;
  /** Monthly technical test usage */
  techTestsUsed: number;
  techTestsLimit: number | null;
  techTestsRemaining: number | null;
}

// === AI CV generation ===
export interface AiFullCvSection {
  title: string;
  sectionType: string;
  content: string;
}

export interface AiFullCvResult {
  name: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  sections: AiFullCvSection[];
}
