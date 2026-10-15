import { test } from "node:test";
import { strict as assert } from "node:assert";
import { generateScenario } from "./scenario-generator";
import {
  SUBSTANCE_WORDS,
  evaluateSubmission,
  stem,
  type ChecklistScenario,
  type SubmissionEvaluation,
} from "./self-check";

const designSystem = generateScenario(
  { roleFocus: "frontend", level: "mid", difficulty: "medium", tags: ["react"] },
  { random: () => 0.1 },
).scenario;

const GENUINE = `## Approach
I built four components in React with TypeScript. The Button supports primary, secondary, ghost and danger variants, three sizes, a loading spinner and a disabled state. The TextInput has a label, helper text, an error state and a character count. The Modal traps focus, closes on Escape and backdrop click, and restores focus to the trigger. Toasts stack in a portal, auto-dismiss after five seconds and can be dismissed manually.
Composition: Modal uses a compound component pattern (Modal.Header, Modal.Body, Modal.Footer) via context.
## Accessibility
All components are keyboard navigable; aria-describedby links errors to inputs; colour contrast was checked with axe.
## Testing
Unit tests with React Testing Library cover variants, keyboard interaction and focus trapping.
## Trade-offs
I chose CSS modules over a runtime CSS-in-JS library because of bundle size; theming would use CSS variables.
\`\`\`tsx
export function Button({ variant = "primary", loading, ...props }: ButtonProps) {
  return <button className={styles[variant]} disabled={loading || props.disabled} {...props} />;
}
\`\`\`
Edge cases: very long labels truncate with an ellipsis and rapid clicks are ignored while loading.`;

function assertBounded(evaluation: SubmissionEvaluation) {
  assert.ok(evaluation.percentage >= 0 && evaluation.percentage <= 100);
  assert.ok(Number.isInteger(evaluation.percentage));
  assert.ok(evaluation.overallScore >= 0 && evaluation.overallScore <= evaluation.maxPossible);
  for (const c of evaluation.criteriaScores) {
    assert.ok(c.score >= 0 && c.score <= c.maxScore, `${c.name}: ${c.score}/${c.maxScore}`);
  }
  assert.equal(
    evaluation.requirementsCovered + evaluation.requirementsMissed.length,
    evaluation.requirementsTotal,
  );
}

test("scores stay within bounds for any input", () => {
  const inputs = [
    "",
    "   ",
    GENUINE,
    GENUINE.repeat(20),
    "```" + "x".repeat(5_000),
    "Button Input Modal Toast Composition ".repeat(200),
    "∂ƒ©˙∆˚¬ … 🚀 && || ##",
  ];
  for (const submission of inputs) assertBounded(evaluateSubmission(submission, designSystem));
});

test("an empty submission covers nothing", () => {
  const evaluation = evaluateSubmission("", designSystem);
  assert.equal(evaluation.percentage, 0);
  assert.equal(evaluation.overallScore, 0);
  assert.equal(evaluation.grade, "F");
  assert.equal(evaluation.requirementsCovered, 0);
  assert.deepStrictEqual(
    evaluation.requirementsMissed,
    designSystem.requirements.map((r) => r.key),
  );
});

test("a genuine answer beats keyword stuffing, which can't reach full marks", () => {
  const stuffed =
    "``` function class interface import export const Button Input Modal Toast " +
    designSystem.evaluationCriteria.map((c) => c.name).join(" ") +
    " test " +
    "lorem ".repeat(500);
  const genuine = evaluateSubmission(GENUINE, designSystem);
  const gamed = evaluateSubmission(stuffed, designSystem);
  assert.ok(gamed.percentage < 100);
  assert.ok(genuine.percentage > gamed.percentage, `${genuine.percentage} vs ${gamed.percentage}`);
  assert.equal(genuine.requirementsMissed.length, 0);
});

test("padding beyond the substance threshold adds nothing", () => {
  const base = evaluateSubmission(GENUINE, designSystem);
  assert.ok(base.wordCount >= SUBSTANCE_WORDS);
  const padded = evaluateSubmission(`${GENUINE}\n${"lorem ipsum ".repeat(2_000)}`, designSystem);
  assert.equal(padded.percentage, base.percentage);
  assert.deepStrictEqual(padded.criteriaScores, base.criteriaScores);
});

test("short write-ups get proportionally less credit", () => {
  const short = evaluateSubmission("Button Input Modal Toast in React.", designSystem);
  assert.ok(short.percentage < 10);
  assert.ok(short.improvements.some((i) => /short/.test(i)));
});

test("requirement keys match whole words only", () => {
  const scenario: ChecklistScenario = {
    requirements: [
      { key: "Auth", text: "Auth." },
      { key: "List", text: "List." },
      { key: "State", text: "State." },
    ],
    evaluationCriteria: [{ name: "Quality", weight: 100, description: "" }],
  };
  const falsePositives = evaluateSubmission(
    "The author will listen to the statement. ".repeat(10),
    scenario,
  );
  assert.equal(falsePositives.requirementsCovered, 0);
  const real = evaluateSubmission("Auth with JWT; a list view; state lives in a store.", scenario);
  assert.equal(real.requirementsCovered, 3);
});

test("multi-word keys and inflections match", () => {
  const scenario: ChecklistScenario = {
    requirements: [
      { key: "CI Pipeline", text: "CI Pipeline." },
      { key: "Caching", text: "Caching." },
      { key: "Multi-env", text: "Multi-env." },
    ],
    evaluationCriteria: [],
  };
  const evaluation = evaluateSubmission(
    "The CI pipelines run on every push. Responses are cached. Multi env config via tfvars.",
    scenario,
  );
  assert.equal(evaluation.requirementsCovered, 3);
});

test("a requirement counts when enough of its distinctive terms are mentioned", () => {
  const scenario: ChecklistScenario = {
    requirements: [
      {
        key: "Auth",
        text: "Implement JWT-based authentication with signup, login, and protected routes.",
      },
    ],
    evaluationCriteria: [],
  };
  assert.equal(
    evaluateSubmission("Users sign up and login; JWT authentication guards routes.", scenario)
      .requirementsCovered,
    1,
  );
  assert.equal(evaluateSubmission("I used JWT.", scenario).requirementsCovered, 0);
});

test("symbols and stop words in criterion names never count", () => {
  const scenario: ChecklistScenario = {
    requirements: [],
    evaluationCriteria: [{ name: "Edge Cases & Polish", weight: 10, description: "" }],
  };
  const symbols = evaluateSubmission(`${"& and the of ".repeat(60)}`, scenario);
  assert.equal(symbols.criteriaScores[0].score, 0);
  const relevant = evaluateSubmission(
    `${"Edge cases are handled and the UI is polished. ".repeat(20)}`,
    scenario,
  );
  assert.equal(relevant.criteriaScores[0].score, 10);
});

test("a scenario without criteria has a 0% checklist", () => {
  const evaluation = evaluateSubmission(GENUINE, { requirements: [], evaluationCriteria: [] });
  assert.equal(evaluation.maxPossible, 0);
  assert.equal(evaluation.percentage, 0);
  assert.equal(evaluation.requirementsTotal, 0);
});

test("invalid weights are treated as zero", () => {
  const evaluation = evaluateSubmission(GENUINE, {
    requirements: [],
    evaluationCriteria: [
      { name: "Testing", weight: Number.NaN },
      { name: "Accessibility", weight: -5 },
    ],
  });
  assert.deepStrictEqual(
    evaluation.criteriaScores.map((c) => [c.score, c.maxScore]),
    [
      [0, 0],
      [0, 0],
    ],
  );
});

test("the summary describes coverage, not quality", () => {
  const evaluation = evaluateSubmission(GENUINE, designSystem);
  assert.match(evaluation.summary, /mentions \d+ of \d+ requirements/);
  assert.match(evaluation.summary, /not how good it is/);
});

test("stem() folds common inflections together", () => {
  assert.equal(stem("caching"), stem("cache"));
  assert.equal(stem("cached"), stem("caches"));
  assert.equal(stem("tests"), stem("testing"));
  assert.equal(stem("logging"), stem("logs"));
  assert.equal(stem("validation"), stem("validated"));
  assert.equal(stem("redis"), "redis");
  assert.equal(stem("status"), "status");
  assert.notEqual(stem("author"), stem("auth"));
});
