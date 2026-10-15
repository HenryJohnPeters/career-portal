/** Question types a bank question may have (the shared InterviewQuestionType). */
export const BANK_QUESTION_TYPES = [
  "theory",
  "coding",
  "debugging",
  "system-design",
  "behavioral",
  "ops",
] as const;

/**
 * A curated interview question shipped with the app (the reference bank).
 * Synced into InterviewQuestion on deploy; `id` is the stable upsert key.
 *
 * Ids are versioned: changing a question's options or meaning needs a new id.
 * The sync then archives the old row (or deletes it when no session used it),
 * so answered sessions keep the version they were graded against.
 */
export interface BankQuestion {
  id: string;
  track: "frontend" | "backend" | "fullstack" | "devops";
  level: "junior" | "mid" | "senior";
  /** 1-5, relative to the level (a "5" for a junior is still a junior question). */
  difficulty: 1 | 2 | 3 | 4 | 5;
  type: (typeof BANK_QUESTION_TYPES)[number];
  /** Canonical tech-tag catalog ids (apps/api/src/common/tech-tags.ts). */
  tags: string[];
  prompt: string;
  /** Answer choices as authored; the sync stores them in a deterministic shuffled order. */
  options: string[];
  correctOptionIndex: number;
  /** "Select all that apply" questions: every correct option (includes correctOptionIndex). */
  correctOptionIndices?: number[];
  multiSelect?: boolean;
  expectedPoints: string[];
  redFlags: string[];
  rubric: { criteria: { name: string; weight: number; keywords: string[] }[] };
  modelAnswer: string;
  followUpIds: string[];
}
