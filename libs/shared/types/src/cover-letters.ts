// === Cover letters (PLAN §2.6) ===

export type CoverLetterTone = "professional" | "friendly";

/** The job a letter is linked to, as embedded in cover-letter payloads. */
export interface CoverLetterJobRef {
  id: string;
  company: string;
  role: string;
}

/** GET /cover-letters (full list, with bodies). */
export interface CoverLetter {
  id: string;
  userId: string;
  title: string;
  body: string;
  jobId?: string | null;
  job?: CoverLetterJobRef | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /cover-letters?summary=1 — lightweight list for pickers (no bodies). */
export interface CoverLetterSummary {
  id: string;
  title: string;
  jobId: string | null;
  updatedAt: string;
}

/**
 * Shared optional fields for the AI routes (`/:id/suggest`, `/:id/rewrite`,
 * `/:id/ai-generate`). `currentBody` is the editor text (≤15000), preferred
 * over the saved body; `useCv: false` never sends CV data to the AI.
 */
export interface CoverLetterAiContext {
  currentBody?: string;
  useCv?: boolean;
}
