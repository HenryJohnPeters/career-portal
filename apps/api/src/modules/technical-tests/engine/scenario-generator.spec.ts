import { test } from "node:test";
import { strict as assert } from "node:assert";
import { isKnownTag } from "../../../common/tech-tags";
import { scenarioSchema } from "../../ai/prompts/tech-test.prompts";
import {
  candidateTemplates,
  countTagMatches,
  generateScenario,
  type GenerateInput,
} from "./scenario-generator";
import { DIFFICULTIES, LEVELS, ROLE_FOCUSES } from "./scenario-types";
import { SCENARIO_TEMPLATES } from "./templates";

/** Small deterministic PRNG (mulberry32) for reproducible runs. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALL_INPUTS: GenerateInput[] = ROLE_FOCUSES.flatMap((roleFocus) =>
  LEVELS.flatMap((level) =>
    DIFFICULTIES.map((difficulty) => ({ roleFocus, level, difficulty, tags: [] })),
  ),
);

test("the same seed and input always give the same scenario", () => {
  const input: GenerateInput = {
    roleFocus: "backend",
    level: "mid",
    difficulty: "medium",
    tags: ["nestjs", "postgresql", "prisma"],
  };
  for (const seed of [1, 42, 2024]) {
    assert.deepStrictEqual(
      generateScenario(input, { random: seeded(seed) }),
      generateScenario(input, { random: seeded(seed) }),
    );
  }
});

test("template ids are unique", () => {
  const ids = SCENARIO_TEMPLATES.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every role has a template for every level and difficulty", () => {
  for (const input of ALL_INPUTS) {
    const candidates = candidateTemplates(SCENARIO_TEMPLATES, input);
    assert.ok(candidates.length > 0, JSON.stringify(input));
    for (const template of candidates) {
      assert.ok(template.roles.includes(input.roleFocus));
      assert.ok(template.levels.includes(input.level), `${template.id} for ${input.level}`);
      assert.ok(template.difficulties.includes(input.difficulty));
    }
  }
});

test("junior/easy never gets a mid/senior template, even with matching tags", () => {
  const input: GenerateInput = {
    roleFocus: "backend",
    level: "junior",
    difficulty: "easy",
    tags: ["kafka", "rabbitmq", "redis", "microservices", "scaling", "distributed systems"],
  };
  for (let seed = 0; seed < 50; seed++) {
    const { templateId, scenario } = generateScenario(input, { random: seeded(seed) });
    assert.notEqual(templateId, "notification-service");
    assert.doesNotMatch(scenario.estimatedTime, /6–10/);
  }
});

test("every template builds a scenario that passes the shared scenario schema", () => {
  for (const input of ALL_INPUTS) {
    for (const template of candidateTemplates(SCENARIO_TEMPLATES, input)) {
      for (const seed of [3, 7]) {
        const { scenario } = generateScenario(input, {
          random: seeded(seed),
          templates: [template],
        });
        const weights = scenario.evaluationCriteria.reduce((sum, c) => sum + c.weight, 0);
        assert.equal(weights, 100, `${template.id} weights`);
        const parsed = scenarioSchema.safeParse(scenario);
        assert.ok(parsed.success, `${template.id} ${JSON.stringify(input)}`);
        assert.ok(scenario.requirements.every((r) => r.key && r.text));
        assert.match(scenario.estimatedTime, /\d/);
      }
    }
  }
});

test("every slot candidate and topic is a catalog tag", () => {
  for (const template of SCENARIO_TEMPLATES) {
    const labels = [...Object.values(template.slots).flat(), ...(template.topics ?? [])];
    const unknown = labels.filter((label) => !isKnownTag(label));
    assert.deepStrictEqual(unknown, [], template.id);
  }
});

test("chosen technologies are used in the brief", () => {
  const { scenario, tagMatches } = generateScenario(
    { roleFocus: "frontend", level: "junior", difficulty: "easy", tags: ["vue", "tailwind css"] },
    { random: seeded(5) },
  );
  assert.ok(tagMatches >= 2);
  assert.match(scenario.brief, /\*\*Vue\*\*/);
  assert.match(scenario.brief, /\*\*Tailwind CSS\*\*/);
});

test("tags the chosen template doesn't cover give zero matches", () => {
  const { tagMatches } = generateScenario(
    { roleFocus: "platform", level: "junior", difficulty: "easy", tags: ["react", "redux"] },
    { random: seeded(9) },
  );
  assert.equal(tagMatches, 0);
  const design = SCENARIO_TEMPLATES.find((t) => t.id === "design-system")!;
  assert.equal(countTagMatches(design, new Set(["react", "tailwind css", "kafka"])), 2);
});

test("the most recently used template is avoided when an equal alternative exists", () => {
  const input: GenerateInput = { roleFocus: "frontend", level: "junior", difficulty: "easy", tags: [] };
  const constant = () => 0.5;
  const first = generateScenario(input, { random: constant });
  const second = generateScenario(input, {
    random: constant,
    recentTemplateIds: [first.templateId],
  });
  assert.notEqual(second.templateId, first.templateId);
});

test("easy, medium and hard have distinct time estimates in every template", () => {
  for (const template of SCENARIO_TEMPLATES) {
    const estimates = DIFFICULTIES.map(
      (difficulty) =>
        generateScenario(
          { roleFocus: template.roles[0], level: "senior", difficulty, tags: [] },
          { random: seeded(1), templates: [template] },
        ).scenario.estimatedTime,
    );
    assert.equal(new Set(estimates).size, 3, `${template.id}: ${estimates.join(", ")}`);
  }
});
