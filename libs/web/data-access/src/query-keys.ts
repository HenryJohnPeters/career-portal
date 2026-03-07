/**
 * Centralised query-key factory.
 * Every React-Query key used in the app is defined here so refactors,
 * invalidations, and cache reads all reference a single source of truth.
 */
export const queryKeys = {
  // Auth
  me: ["me"] as const,

  // Dashboard
  dashboardSummary: ["dashboard-summary"] as const,

  // CV
  cvVersions: ["cv-versions"] as const,
  cvSections: (versionId: string | null) => ["cv-sections", versionId] as const,
  cvHtmlPreview: (versionId: string | null) =>
    ["cv-html-preview", versionId] as const,

  // Questions
  questions: (category?: string) => ["questions", category] as const,
  questionAnswers: ["question-answers"] as const,

  // Practice
  practiceUsage: ["practice-usage"] as const,
  practiceOptions: ["practice-options"] as const,

  // Cover Letters
  coverLetters: ["cover-letters"] as const,

  // Jobs
  jobs: ["jobs"] as const,

  // Interview Prep
  interviewOptions: ["interview-options"] as const,
  interviewSessions: ["interview-sessions"] as const,
  interviewSession: (id: string | null) => ["interview-session", id] as const,
  interviewNextQuestion: (id: string | null) =>
    ["interview-next-question", id] as const,

  // Technical Tests
  technicalTests: ["technical-tests"] as const,
  technicalTest: (id: string | null) => ["technical-test", id] as const,

  // AI Usage
  aiUsage: ["ai-usage"] as const,

  // Billing
  subscriptionStatus: ["subscription-status"] as const,
} as const;
