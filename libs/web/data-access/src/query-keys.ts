import type { QueryClient } from "@tanstack/react-query";

/**
 * Centralised query-key factory. Detail keys nest under their list key
 * (e.g. ["jobs", "detail", id]) so invalidating the list key also refreshes
 * every related detail/aggregate query.
 */
export const queryKeys = {
  // Auth / account
  me: ["me"] as const,

  // Usage
  planUsage: ["plan-usage"] as const,
  /** Legacy GET /auth/ai-usage */
  aiUsage: ["ai-usage"] as const,

  // Dashboard
  dashboardSummary: ["dashboard-summary"] as const,

  // CV
  cvVersions: ["cv-versions"] as const,
  /** Under cvVersions, so every invalidation of the full list refreshes it too. */
  cvVersionSummaries: ["cv-versions", "summary"] as const,
  cvSectionsAll: ["cv-sections"] as const,
  cvSections: (versionId: string | null) => ["cv-sections", versionId] as const,
  cvHtmlPreviewAll: ["cv-html-preview"] as const,
  cvHtmlPreview: (versionId: string | null) =>
    ["cv-html-preview", versionId] as const,

  // Cover letters
  coverLetters: ["cover-letters"] as const,
  coverLetterSummaries: ["cover-letters", "summary"] as const,
  coverLetterHtmlPreviewAll: ["cover-letter-html-preview"] as const,
  coverLetterHtmlPreview: (id: string | null, cvVersionId?: string | null) =>
    ["cover-letter-html-preview", id, cvVersionId ?? null] as const,

  // Jobs
  jobs: ["jobs"] as const,
  job: (id: string | null) => ["jobs", "detail", id] as const,
  jobInsights: ["jobs", "insights"] as const,

  // Interview prep
  interviewOptions: ["interview-options"] as const,
  interviewSessions: ["interview-sessions"] as const,
  interviewSession: (id: string | null) => ["interview-session", id] as const,
  interviewNextQuestion: (id: string | null) =>
    ["interview-next-question", id] as const,
  interviewProgress: ["interview-progress"] as const,

  // Technical tests
  technicalTests: ["technical-tests"] as const,
  technicalTest: (id: string | null) =>
    ["technical-tests", "detail", id] as const,

  // Billing
  subscriptionStatus: ["subscription-status"] as const,
} as const;

/** Refresh plan usage meters (and the legacy AI usage query) after anything that consumes quota. */
export function invalidateUsage(qc: QueryClient): Promise<void> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.planUsage }),
    qc.invalidateQueries({ queryKey: queryKeys.aiUsage }),
  ]).then(() => undefined);
}
