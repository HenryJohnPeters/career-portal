import {
  DIFFICULTIES,
  LEVELS,
  type Difficulty,
  type Level,
  type ScenarioTemplate,
} from "../scenario-types";

export const ALL_LEVELS = LEVELS;
export const ALL_DIFFICULTIES = DIFFICULTIES;

/** Keeps the slot names typed inside `build` while storing templates in one list. */
export function defineTemplate<Slot extends string>(
  template: ScenarioTemplate<Slot>,
): ScenarioTemplate {
  return template;
}

export function levelLabel(level: Level): string {
  if (level === "junior") return "Junior";
  if (level === "senior") return "Senior / Staff";
  return "Mid-Level";
}

export function difficultyAdjective(difficulty: Difficulty): string {
  if (difficulty === "easy") return "straightforward";
  if (difficulty === "hard") return "complex, production-grade";
  return "moderately complex";
}

/** One value per difficulty, so "easy" is never silently treated as "hard". */
export function byDifficulty<T>(
  difficulty: Difficulty,
  values: { easy: T; medium: T; hard: T },
): T {
  return values[difficulty];
}

/** `items` for mid and senior candidates, nothing for juniors. */
export function beyondJunior<T>(level: Level, items: T[]): T[] {
  return level === "junior" ? [] : items;
}

/** `items` for hard tests only. */
export function hardOnly<T>(difficulty: Difficulty, items: T[]): T[] {
  return difficulty === "hard" ? items : [];
}

/** Non-functional requirements that scale with level and difficulty. */
export function extraRequirements(level: Level, difficulty: Difficulty): string[] {
  const extras: string[] = [];
  if (level !== "junior") {
    extras.push("Include proper error handling and input validation throughout.");
  }
  if (level === "senior" || difficulty === "hard") {
    extras.push("Write unit and/or integration tests for critical paths.");
    extras.push("Document your architectural decisions and trade-offs in a short README.");
  }
  if (difficulty === "hard") {
    extras.push(
      "Consider scalability — your solution should handle at least 10,000 concurrent users.",
    );
    extras.push("Implement proper logging and observability hooks.");
  }
  return extras;
}
