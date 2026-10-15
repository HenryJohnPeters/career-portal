/*
 * Types shared by the scenario engine, the templates and the AI scenario
 * generator (which imports TechTestScenario via scenario-generator.ts).
 * Mirrors libs/shared/types/src/technical-tests.ts.
 */

export const ROLE_FOCUSES = ["frontend", "backend", "fullstack", "platform"] as const;
export const LEVELS = ["junior", "mid", "senior"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type RoleFocus = (typeof ROLE_FOCUSES)[number];
export type Level = (typeof LEVELS)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface TechTestScenario {
  title: string;
  companyContext: string;
  brief: string;
  background: string;
  requirements: { key: string; text: string }[];
  nonFunctional: string[];
  acceptanceCriteria: string[];
  bonusChallenges: string[];
  evaluationCriteria: { name: string; weight: number; description: string }[];
  hints: string[];
  estimatedTime: string;
  deliverables: string[];
  constraints: string[];
}

/** What a template's `build` receives. */
export interface TemplateContext<Slot extends string> {
  level: Level;
  difficulty: Difficulty;
  /** The first candidate of `slot` the user selected (as its display label), else `fallback`. */
  choose(slot: Slot, fallback: string): string;
  /** Like `choose`, but undefined when the user selected none of the slot's candidates. */
  chooseOptional(slot: Slot): string | undefined;
  /** A random element (from the generator's RNG, so seeded runs are reproducible). */
  pick<T>(items: readonly T[]): T;
}

/**
 * A static take-home scenario. `slots` lists, per technology choice, the
 * catalog tags (display labels, in preference order) the brief can be built
 * around; they also drive template selection and the "weak match" signal.
 */
export interface ScenarioTemplate<Slot extends string = string> {
  id: string;
  roles: readonly RoleFocus[];
  levels: readonly Level[];
  difficulties: readonly Difficulty[];
  slots: Readonly<Record<Slot, readonly string[]>>;
  /** Further catalog tags the brief exercises (concepts), used for matching only. */
  topics?: readonly string[];
  build(ctx: TemplateContext<Slot>): TechTestScenario;
}
