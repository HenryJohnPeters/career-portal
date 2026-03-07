import { IPersonaResponder } from "./interfaces";

/**
 * Generates interviewer-persona-flavored response templates.
 * Simulates different interviewer styles: friendly, neutral, tough.
 */
export class PersonaResponder implements IPersonaResponder {
  respond(
    persona: string,
    score: number,
    maxScore: number,
    pointsMissed: string[]
  ): string {
    const ratio = maxScore > 0 ? score / maxScore : 0;
    const templates =
      PERSONA_TEMPLATES[persona] ?? PERSONA_TEMPLATES["neutral"];

    if (ratio >= 0.8) return templates.excellent;
    if (ratio >= 0.6) return templates.good;
    if (ratio >= 0.4) {
      const missed = pointsMissed.slice(0, 2).join(" and ");
      return templates.partial.replace(
        "{missed}",
        missed || "some key concepts"
      );
    }
    return templates.weak.replace(
      "{missed}",
      pointsMissed.slice(0, 3).join(", ") || "several important concepts"
    );
  }
}

interface PersonaTemplate {
  excellent: string;
  good: string;
  partial: string;
  weak: string;
}

const PERSONA_TEMPLATES: Record<string, PersonaTemplate> = {
  friendly: {
    excellent:
      "Great job! You really nailed that one. Your understanding is solid — let's keep the momentum going!",
    good: "Nice work! You covered the main points well. A few small details could round it out, but overall solid.",
    partial:
      "Good effort! You're on the right track, but I'd love to hear more about {missed}. Want to give it another shot?",
    weak: "I can see you're thinking about this, which is great! Let's dig deeper into {missed} — these are important areas to strengthen.",
  },
  neutral: {
    excellent:
      "Correct. Your answer covers all the key points comprehensively. Moving on.",
    good: "Your answer is mostly correct and covers the core concepts. Some areas could use more detail.",
    partial:
      "Partially correct. You missed {missed}. Let me ask a follow-up to explore this further.",
    weak: "Your answer is incomplete. Key areas missed: {missed}. Let's revisit this topic.",
  },
  tough: {
    excellent:
      "Acceptable. You covered what was expected. In a real interview, I'd push for more depth. Next question.",
    good: "You got the basics, but a senior candidate should go deeper. What about the edge cases?",
    partial:
      "That's not sufficient. You completely missed {missed}. Can you explain why those matter?",
    weak: "I'm concerned about this gap. You missed {missed}. This is fundamental — you need to study this thoroughly.",
  },
};
