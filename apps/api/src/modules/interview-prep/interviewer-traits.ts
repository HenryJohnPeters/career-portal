/** Interviewer traits type (synced with frontend) */
export interface InterviewerTraits {
  questionCount: number;
  adviceLevel: "minimal" | "standard" | "detailed";
  fiftyFifty: boolean;
  /** The persona template this interviewer uses for answer responses */
  persona: "friendly" | "neutral" | "tough";
}

/**
 * Interviewer traits lookup map (synced with frontend configs).
 * persona drives PersonaResponder template selection; adviceLevel controls verbosity.
 */
export const INTERVIEWER_TRAITS: Record<string, InterviewerTraits> = {
  none: {
    questionCount: 25,
    adviceLevel: "standard",
    fiftyFifty: false,
    persona: "neutral",
  },
  alex: {
    questionCount: 5,
    adviceLevel: "detailed",
    fiftyFifty: true,
    persona: "friendly",
  },
  riley: {
    questionCount: 7,
    adviceLevel: "detailed",
    fiftyFifty: false,
    persona: "friendly",
  },
  morgan: {
    questionCount: 10,
    adviceLevel: "standard",
    fiftyFifty: false,
    persona: "neutral",
  },
  sam: {
    questionCount: 12,
    adviceLevel: "standard",
    fiftyFifty: false,
    persona: "neutral",
  },
  kai: {
    questionCount: 15,
    adviceLevel: "minimal",
    fiftyFifty: false,
    persona: "neutral",
  },
  jordan: {
    questionCount: 15,
    adviceLevel: "minimal",
    fiftyFifty: false,
    persona: "tough",
  },
  phoenix: {
    questionCount: 18,
    adviceLevel: "minimal",
    fiftyFifty: false,
    persona: "tough",
  },
  nova: {
    questionCount: 20,
    adviceLevel: "minimal",
    fiftyFifty: false,
    persona: "neutral",
  },
};

export function clampQuestionCount(value: number): number {
  return Math.max(3, Math.min(25, value));
}
