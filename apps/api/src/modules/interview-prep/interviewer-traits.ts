import { FREE_TIER } from "../../common/constants";

export type AdviceLevel = "minimal" | "standard" | "detailed";
export type InterviewPersona = "friendly" | "neutral" | "tough";

/**
 * How an interviewer runs a session. The web keeps its own display data
 * (names, avatars, copy) keyed by the same ids, in the same order.
 */
export interface InterviewerTraits {
  questionCount: number;
  adviceLevel: AdviceLevel;
  /** Offer the 50/50 hint (two wrong options struck out) on single-answer questions. */
  fiftyFifty: boolean;
  /** Feedback tone for answers. */
  persona: InterviewPersona;
}

/**
 * Every interviewer, in display order. This list is the single server-side
 * source: the DTO whitelist, premium gating and session settings derive from it.
 * The first FREE_TIER.interviewerCount entries are free.
 */
const INTERVIEWERS = [
  ["none", { questionCount: 25, adviceLevel: "standard", fiftyFifty: false, persona: "neutral" }],
  ["alex", { questionCount: 5, adviceLevel: "detailed", fiftyFifty: true, persona: "friendly" }],
  ["riley", { questionCount: 7, adviceLevel: "detailed", fiftyFifty: false, persona: "friendly" }],
  ["morgan", { questionCount: 10, adviceLevel: "standard", fiftyFifty: false, persona: "neutral" }],
  ["sam", { questionCount: 12, adviceLevel: "standard", fiftyFifty: false, persona: "neutral" }],
  ["kai", { questionCount: 15, adviceLevel: "minimal", fiftyFifty: false, persona: "neutral" }],
  ["jordan", { questionCount: 15, adviceLevel: "minimal", fiftyFifty: false, persona: "tough" }],
  ["phoenix", { questionCount: 18, adviceLevel: "minimal", fiftyFifty: false, persona: "tough" }],
  ["nova", { questionCount: 20, adviceLevel: "minimal", fiftyFifty: false, persona: "neutral" }],
] as const satisfies readonly (readonly [string, InterviewerTraits])[];

export type InterviewerId = (typeof INTERVIEWERS)[number][0];

export const INTERVIEWER_IDS: readonly InterviewerId[] = INTERVIEWERS.map(([id]) => id);

const TRAITS: ReadonlyMap<string, InterviewerTraits> = new Map(
  INTERVIEWERS.map(([id, traits]) => [id, traits]),
);

const FREE_INTERVIEWER_IDS: ReadonlySet<string> = new Set(
  INTERVIEWER_IDS.slice(0, FREE_TIER.interviewerCount),
);

/** Session question-count bounds (also the DTO bounds). */
export const MIN_QUESTION_COUNT = 3;
export const MAX_QUESTION_COUNT = 25;

export function getInterviewerTraits(
  interviewerId: string | null | undefined,
): InterviewerTraits | undefined {
  return interviewerId ? TRAITS.get(interviewerId) : undefined;
}

export function isInterviewerFree(interviewerId: string): boolean {
  return FREE_INTERVIEWER_IDS.has(interviewerId);
}

export function clampQuestionCount(value: number): number {
  if (!Number.isFinite(value)) return MIN_QUESTION_COUNT;
  return Math.max(MIN_QUESTION_COUNT, Math.min(MAX_QUESTION_COUNT, Math.round(value)));
}

/** Public interviewer list for GET /interview-prep/options. */
export function listInterviewers(): {
  id: InterviewerId;
  free: boolean;
  questionCount: number;
  adviceLevel: AdviceLevel;
  fiftyFifty: boolean;
}[] {
  return INTERVIEWERS.map(([id, traits]) => ({
    id,
    free: FREE_INTERVIEWER_IDS.has(id),
    questionCount: traits.questionCount,
    adviceLevel: traits.adviceLevel,
    fiftyFifty: traits.fiftyFifty,
  }));
}
