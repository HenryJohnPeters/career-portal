import { BadRequestException } from "@nestjs/common";
import { MAX_SELECTED_TAGS, normalizeTags } from "../../common/tech-tags";
import {
  clampQuestionCount,
  getInterviewerTraits,
  type AdviceLevel,
  type InterviewPersona,
} from "./interviewer-traits";

/** A session needs at least this many questions, or it is not created (422). */
export const MIN_SESSION_QUESTIONS = 3;
/** Points per question (the engine scores 0 or this). */
export const QUESTION_MAX_SCORE = 10;
/** Upper bound on bank rows loaded as selection candidates for one pool. */
export const MAX_POOL_CANDIDATES = 1000;
/** Questions served in this window are down-weighted when picking new ones. */
export const RECENT_QUESTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_RECENT_QUESTIONS = 300;

export const NOT_ENOUGH_QUESTIONS_MESSAGE =
  "Not enough questions for this combination yet — try fewer tags";

/**
 * Canonical catalog ids for a session's tags: trimmed, lowercased, aliases
 * resolved, de-duplicated. Unknown tags or more than MAX_SELECTED_TAGS → 400
 * (the DTO rejects these first; this guards every other caller).
 */
export function resolveSessionTags(raw: readonly string[] | undefined): string[] {
  const { tags, unknown } = normalizeTags(raw ?? []);
  if (unknown.length > 0) {
    throw new BadRequestException(
      `Unknown tag${unknown.length === 1 ? "" : "s"}: ${unknown
        .slice(0, 3)
        .map((t) => `"${t.slice(0, 60)}"`)
        .join(", ")}. Choose tags from the catalog.`,
    );
  }
  if (tags.length > MAX_SELECTED_TAGS) {
    throw new BadRequestException(`Choose at most ${MAX_SELECTED_TAGS} tags.`);
  }
  return tags;
}

export interface SessionShapeInput {
  interviewerId?: string;
  questionCount?: number;
  persona?: string;
}

export interface SessionShape {
  interviewerId: string | null;
  questionCount: number;
  persona: InterviewPersona;
  adviceLevel: AdviceLevel;
}

/** The interviewer's traits win over explicit count/persona values. */
export function resolveSessionShape(input: SessionShapeInput): SessionShape {
  const traits = getInterviewerTraits(input.interviewerId);
  return {
    interviewerId: traits ? (input.interviewerId as string) : null,
    questionCount: clampQuestionCount(traits?.questionCount ?? input.questionCount ?? 10),
    persona: traits?.persona ?? toPersona(input.persona),
    adviceLevel: traits?.adviceLevel ?? "standard",
  };
}

function toPersona(value: string | undefined): InterviewPersona {
  return value === "friendly" || value === "tough" ? value : "neutral";
}
