import {
  PREMIUM_FEATURE_LABELS,
  QUOTA_LABELS,
  type PremiumFeature,
  type QuotaKey,
} from "@careerportal/shared/types";

/** What the upgrade prompt was opened for (mirrors UpgradePromptRequest). */
export interface UpgradeCopyInput {
  reason: "quota_exceeded" | "premium_required";
  quota?: QuotaKey;
  feature?: PremiumFeature;
  message?: string;
  limit?: number;
  resetsAt?: string | null;
}

export interface UpgradeCopy {
  title: string;
  description: string;
  /** What Premium adds for this situation. Only shipped features (PLAN_FEATURES). */
  benefits: string[];
}

const QUOTA_BENEFITS: Record<QuotaKey, string[]> = {
  aiActions: [
    "Unlimited AI writing and job analysis (fair use)",
    "Our higher-quality AI model",
    "One-click Tailor-for-this-job kit",
  ],
  cvVersions: [
    "Unlimited CV versions",
    "All CV templates",
    "One-click Tailor-for-this-job kit",
  ],
  coverLetters: [
    "Unlimited cover letters",
    "Unlimited AI writing (fair use)",
    "One-click Tailor-for-this-job kit",
  ],
  mockSessions: [
    "Unlimited mock interviews",
    "All interviewer personalities",
    "Full progress breakdown and weekly trend",
  ],
  questions: [
    "Unlimited practice questions",
    "AI-generated questions for niche tech stacks",
    "Full progress breakdown and weekly trend",
  ],
  techTests: [
    "Unlimited technical tests",
    "AI review of your submissions",
    "AI-generated test scenarios",
  ],
};

const FEATURE_DESCRIPTIONS: Record<PremiumFeature, string> = {
  templates: "Premium unlocks every CV template, so you can match the style to each application.",
  interviewers: "Premium unlocks every interviewer personality, from friendly to demanding.",
  tailorKit:
    "Create a CV tailored to a job's description in one click, with an optional matching cover letter.",
  insights:
    "See which CV version gets the most responses, alongside your full application funnel.",
  aiTechReview:
    "Get an AI review of your take-home submission: strengths, improvements and a score for each criterion.",
  progressBreakdown:
    "See your accuracy for every topic and question type, plus your weekly trend.",
  aiQuestionGeneration:
    "Generate fresh interview questions for niche tech-stack combinations.",
};

const FEATURE_BENEFITS: string[] = [
  "Unlimited CVs, cover letters and practice",
  "Unlimited AI on our higher-quality model (fair use)",
  "Tailor-for-this-job kit and full insights",
];

/** Allowances with a reset date are monthly; the rest (CVs, letters) are totals. */
function isMonthly(input: UpgradeCopyInput): boolean {
  if (input.resetsAt) return true;
  return input.quota !== "cvVersions" && input.quota !== "coverLetters";
}

/*
 * The quota / feature keys come from API error details, so an unknown key
 * (e.g. a newer API) must fall back to generic copy rather than crash the
 * app-wide dialog.
 */
function isKnownQuota(quota: string | undefined): quota is QuotaKey {
  return !!quota && Object.prototype.hasOwnProperty.call(QUOTA_BENEFITS, quota);
}

function isKnownFeature(feature: string | undefined): feature is PremiumFeature {
  return !!feature && Object.prototype.hasOwnProperty.call(FEATURE_DESCRIPTIONS, feature);
}

export function getUpgradeCopy(input: UpgradeCopyInput): UpgradeCopy {
  if (input.reason === "quota_exceeded" && isKnownQuota(input.quota)) {
    const noun = QUOTA_LABELS[input.quota];
    const monthly = isMonthly(input);
    const hasLimit = typeof input.limit === "number";
    const title = hasLimit
      ? monthly
        ? `You've used all ${input.limit} ${noun} this month`
        : `You've reached the free limit of ${input.limit} ${noun}`
      : `You've reached your free ${noun} limit`;
    const description = hasLimit
      ? `The free plan includes ${input.limit} ${noun}${monthly ? " a month" : ""}. Upgrade to Premium to keep going without limits.`
      : (input.message?.trim() || "Upgrade to Premium to keep going without limits.");
    return { title, description, benefits: QUOTA_BENEFITS[input.quota] };
  }

  if (input.reason === "premium_required" && isKnownFeature(input.feature)) {
    return {
      title: `${PREMIUM_FEATURE_LABELS[input.feature]} is a Premium feature`,
      description: FEATURE_DESCRIPTIONS[input.feature],
      benefits: FEATURE_BENEFITS,
    };
  }

  return {
    title: "Upgrade to Premium",
    description: input.message?.trim() || "This is part of Premium.",
    benefits: FEATURE_BENEFITS,
  };
}
