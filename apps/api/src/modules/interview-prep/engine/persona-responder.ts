import type { AdviceLevel } from "../interviewer-traits";

interface PersonaTemplate {
  correct: string;
  incorrect: string;
}

/** `{missed}` is replaced by the first missed points. */
const PERSONA_TEMPLATES: Record<string, PersonaTemplate> = {
  friendly: {
    correct:
      "Great job! You really nailed that one. Your understanding is solid — let's keep the momentum going!",
    incorrect:
      "I can see you're thinking about this, which is great! Let's dig deeper into {missed} — these are important areas to strengthen.",
  },
  neutral: {
    correct: "Correct. Your answer covers all the key points comprehensively. Moving on.",
    incorrect: "Your answer is incomplete. Key areas missed: {missed}. Let's revisit this topic.",
  },
  tough: {
    correct:
      "Acceptable. You covered what was expected. In a real interview, I'd push for more depth. Next question.",
    incorrect:
      "I'm concerned about this gap. You missed {missed}. This is fundamental — you need to study this thoroughly.",
  },
};

const DETAILED_CORRECT_TIP =
  " Pro tip: In a real interview, you'd want to also discuss potential edge cases and scalability considerations. Keep up the great work!";
const DETAILED_INCORRECT_TIP =
  " Here's what I'd recommend: review the fundamentals, practice explaining the concepts out loud, and try to connect the theory to real-world use cases. You'll get there!";

/**
 * Interviewer-flavoured reaction to an answer. Grading is all-or-nothing, so
 * there are two outcomes; the advice level sets how much the interviewer says.
 */
export function personaResponse(
  persona: string,
  isCorrect: boolean,
  pointsMissed: readonly string[],
  adviceLevel: AdviceLevel = "standard",
): string {
  if (adviceLevel === "minimal") {
    return isCorrect ? "Good answer." : "Not quite. Study this topic thoroughly.";
  }

  const templates = PERSONA_TEMPLATES[persona] ?? PERSONA_TEMPLATES.neutral;
  const base = isCorrect
    ? templates.correct
    : templates.incorrect.replace(
        "{missed}",
        pointsMissed.slice(0, 3).join(", ") || "several important concepts",
      );

  if (adviceLevel === "detailed") {
    return base + (isCorrect ? DETAILED_CORRECT_TIP : DETAILED_INCORRECT_TIP);
  }
  return base;
}
