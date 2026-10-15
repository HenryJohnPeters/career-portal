/**
 * Static technical-test scenario engine: picks the best-fitting template for a
 * role, level, difficulty and tech stack, and builds the scenario from it.
 * Template content lives in ./templates; this file is selection logic only.
 * It never calls AI, so free users' tests cost nothing to generate.
 */
import { normalizeTag } from "../../../common/tech-tags";
import type {
  Difficulty,
  Level,
  RoleFocus,
  ScenarioTemplate,
  TechTestScenario,
} from "./scenario-types";
import { SCENARIO_TEMPLATES } from "./templates";

export type { Difficulty, Level, RoleFocus, TechTestScenario } from "./scenario-types";

export interface GenerateInput {
  roleFocus: RoleFocus;
  level: Level;
  difficulty: Difficulty;
  /** Tech-tag catalog ids (other spellings are normalised). */
  tags: readonly string[];
}

export interface GenerateOptions {
  /** Defaults to Math.random; pass a seeded generator for reproducible output. */
  random?: () => number;
  /** Template ids of the user's latest tests, newest first; these are de-prioritised. */
  recentTemplateIds?: readonly (string | null | undefined)[];
  templates?: readonly ScenarioTemplate[];
}

export interface GeneratedScenario {
  templateId: string;
  /** How many of the user's tags the chosen template covers (0 = weak match). */
  tagMatches: number;
  scenario: TechTestScenario;
}

const TAG_MATCH_POINTS = 2;
/** Random spread between candidates so equally good templates rotate. */
const JITTER_POINTS = 3;
/** Penalty for templates used in the user's latest tests, newest first. */
const RECENCY_PENALTIES = [6, 4, 2] as const;

const templateTagIds = new WeakMap<ScenarioTemplate, ReadonlySet<string>>();

/** Catalog ids of every technology and topic a template covers. */
function tagIdsOf(template: ScenarioTemplate): ReadonlySet<string> {
  let ids = templateTagIds.get(template);
  if (!ids) {
    const labels = [...Object.values(template.slots).flat(), ...(template.topics ?? [])];
    ids = new Set(labels.map(normalizeTag));
    templateTagIds.set(template, ids);
  }
  return ids;
}

export function countTagMatches(
  template: ScenarioTemplate,
  tags: ReadonlySet<string>,
): number {
  const covered = tagIdsOf(template);
  let matches = 0;
  for (const tag of tags) if (covered.has(tag)) matches++;
  return matches;
}

/**
 * Templates for the role that also allow the level and difficulty. Falls back
 * to role-only, then to everything, so selection never comes up empty.
 */
export function candidateTemplates(
  templates: readonly ScenarioTemplate[],
  input: Pick<GenerateInput, "roleFocus" | "level" | "difficulty">,
): readonly ScenarioTemplate[] {
  const forRole = templates.filter((t) => t.roles.includes(input.roleFocus));
  const strict = forRole.filter(
    (t) => t.levels.includes(input.level) && t.difficulties.includes(input.difficulty),
  );
  if (strict.length > 0) return strict;
  return forRole.length > 0 ? forRole : templates;
}

function recencyPenalty(
  templateId: string,
  recent: readonly (string | null | undefined)[],
): number {
  const index = recent.slice(0, RECENCY_PENALTIES.length).indexOf(templateId);
  return index === -1 ? 0 : RECENCY_PENALTIES[index];
}

function pickWith<T>(random: () => number, items: readonly T[]): T {
  if (items.length === 0) throw new Error("pick() needs at least one item");
  const index = Math.floor(random() * items.length);
  return items[Math.min(items.length - 1, Math.max(0, index))];
}

export function generateScenario(
  input: GenerateInput,
  options: GenerateOptions = {},
): GeneratedScenario {
  const random = options.random ?? Math.random;
  const recent = options.recentTemplateIds ?? [];
  const tags = new Set(input.tags.map(normalizeTag));

  let best: { template: ScenarioTemplate; matches: number; score: number } | null = null;
  for (const template of candidateTemplates(options.templates ?? SCENARIO_TEMPLATES, input)) {
    const matches = countTagMatches(template, tags);
    const score =
      matches * TAG_MATCH_POINTS +
      random() * JITTER_POINTS -
      recencyPenalty(template.id, recent);
    if (!best || score > best.score) best = { template, matches, score };
  }
  if (!best) throw new Error("No technical-test templates are registered");

  const { template, matches } = best;
  const chooseOptional = (slot: string): string | undefined =>
    (template.slots[slot] ?? []).find((label) => tags.has(normalizeTag(label)));

  const scenario = template.build({
    level: input.level,
    difficulty: input.difficulty,
    choose: (slot, fallback) => chooseOptional(slot) ?? fallback,
    chooseOptional,
    pick: (items) => pickWith(random, items),
  });

  return { templateId: template.id, tagMatches: matches, scenario };
}
