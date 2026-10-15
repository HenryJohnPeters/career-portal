import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { tokenize } from "./tokenize";
import { scanKeywords } from "./lexicon";
import { extractJobKeywords, MAX_KEYWORDS } from "./job-keywords";
import { matchCvToJobDescription } from "./match-engine";
import { runAtsChecks } from "./ats-checks";
import type { MatchCv } from "./match.types";

const keywordsIn = (text: string): string[] => {
  const found: string[] = [];
  scanKeywords(tokenize(text), (keyword) => found.push(keyword.label));
  return found;
};

const cv = (sections: MatchCv["sections"], contact: Partial<MatchCv> = {}): MatchCv => ({
  email: "jane@example.com",
  phone: "+44 7700 900000",
  photoUrl: null,
  sections,
  ...contact,
});

describe("tokenize", () => {
  test("keeps tech punctuation and drops sentence dots", () => {
    assert.deepEqual(
      tokenize("We use C#, C++ and .NET with Node.js.").map((t) => t.norm),
      ["we", "use", "c#", "c++", "and", ".net", "with", "node.js"],
    );
  });

  test("splits on slashes and hyphens", () => {
    assert.deepEqual(tokenize("CI/CD front-end").map((t) => t.norm), ["ci", "cd", "front", "end"]);
  });

  test("marks the first word of each line and sentence", () => {
    const starts = tokenize("Go fast. Then stop\nNext line").map((t) => t.sentenceStart);
    assert.deepEqual(starts, [true, false, true, false, true, false]);
  });
});

describe("lexicon matching", () => {
  test("resolves aliases to one canonical keyword", () => {
    assert.deepEqual(keywordsIn("postgres, k8s, golang, nodejs"), [
      "PostgreSQL",
      "Kubernetes",
      "Go",
      "Node.js",
    ]);
  });

  test("prefers the longest phrase at a position", () => {
    assert.deepEqual(keywordsIn("React Native and React"), ["React Native", "React"]);
    assert.deepEqual(keywordsIn("SQL Server"), ["SQL Server"]);
  });

  test("ignores ordinary English uses of ambiguous words", () => {
    assert.deepEqual(keywordsIn("Go above and beyond for the rest of the team"), []);
    assert.deepEqual(keywordsIn("a solid understanding of state and performance"), []);
    assert.deepEqual(keywordsIn("Express your ideas"), []);
    assert.deepEqual(keywordsIn("a valid passport and no generic applications"), []);
    assert.deepEqual(keywordsIn("Passport.js and TypeScript generics"), ["Passport.js", "TypeScript", "Generics"]);
  });

  test("matches case-sensitive names used as names", () => {
    assert.deepEqual(keywordsIn("Services in Go and Python"), ["Go", "Python"]);
    assert.deepEqual(keywordsIn("Go, Rust"), ["Go", "Rust"]);
    assert.deepEqual(keywordsIn("REST APIs"), ["REST"]);
    assert.deepEqual(keywordsIn("Node/Express services"), ["Node.js", "Express"]);
  });

  test("matches plural and singular phrase variants", () => {
    assert.deepEqual(keywordsIn("code reviews, a microservice"), ["Code review", "Microservices"]);
  });
});

describe("extractJobKeywords", () => {
  const advert = [
    "Senior Frontend Engineer",
    "About the role",
    "You will work on our design system.",
    "Requirements:",
    "- Strong experience with TypeScript",
    "- Docker",
    "Nice to have:",
    "- GraphQL",
    "- Kubernetes",
  ].join("\n");

  test("weights requirements above nice-to-haves", () => {
    const weights = new Map(extractJobKeywords(advert).map((k) => [k.keyword, k.weight]));
    assert.ok(weights.get("TypeScript")! > weights.get("GraphQL")!);
    assert.ok(weights.get("Docker")! > weights.get("Kubernetes")!);
  });

  test("list items that mention experience or skills never start a new section", () => {
    const weightsOf = (text: string) =>
      new Map(extractJobKeywords(text).map((k) => [k.keyword, k.weight]));
    const bulleted = weightsOf(
      "Engineer\nAbout the role\nYou will build things.\nRequirements:\n- React\nNice to have:\n- Experience with Rust\n- Kafka",
    );
    assert.ok(bulleted.get("React")! > bulleted.get("Rust")!);
    assert.equal(bulleted.get("Rust"), bulleted.get("Kafka"));
    // Pasted from a web page: the bullets are gone.
    const pasted = weightsOf(
      "Engineer\nAbout the role\nYou will build things.\nRequirements\nReact\nNice to have\nExperience with Rust\nKafka",
    );
    assert.ok(pasted.get("React")! > pasted.get("Kafka")!);
    assert.equal(pasted.get("Rust"), pasted.get("Kafka"));
    // "Label: items" lines start the labelled section.
    const inline = weightsOf("Engineer\nAbout the role\nYou will build things.\nNice to have: Rust\nKafka");
    assert.equal(inline.get("Kafka"), inline.get("Rust"));
  });

  test("weights repeated keywords higher and sorts by weight", () => {
    const keywords = extractJobKeywords("We use Vue.\nVue and Vue again.\nSome Svelte.");
    assert.equal(keywords[0].keyword, "Vue");
    assert.ok(keywords[0].weight > keywords[1].weight);
  });

  test("caps the number of keywords", () => {
    const many = extractJobKeywords(
      "React Vue Angular Svelte Python Java Go Rust PHP Ruby Kotlin Scala Elixir Swift Dart " +
        "Docker Kubernetes Terraform AWS Azure GCP Redis Kafka RabbitMQ MySQL PostgreSQL MongoDB " +
        "Jest Cypress Playwright Vitest Webpack Vite ESLint Prettier GraphQL gRPC Prisma Django " +
        "Flask FastAPI Laravel NestJS Fastify Nginx Linux Bash Git Jira Figma",
    );
    assert.equal(many.length, MAX_KEYWORDS);
  });

  test("falls back to repeated words for non-technical adverts", () => {
    const keywords = extractJobKeywords(
      "Marketing manager. You will plan marketing campaigns and report on campaigns budgets weekly.",
    );
    const words = keywords.filter((k) => !k.fromLexicon).map((k) => k.keyword);
    assert.deepEqual(words.sort(), ["campaigns", "marketing"]);
  });
});

describe("matchCvToJobDescription", () => {
  // Line 1 is the title (weighted up), so the requirements all weigh the same.
  const advert = "Platform engineer\nRequirements:\n- React\n- TypeScript\n- PostgreSQL\n- Kubernetes";
  const base = cv([
    { title: "Profile", sectionType: "profile", content: "Frontend developer." },
    { title: "Work history", sectionType: "experience", content: "Built React apps with Postgres." },
    { title: "Tech Skills", sectionType: "skills", content: "TypeScript, React" },
  ]);

  test("finds keywords per section, alias-aware", () => {
    const result = matchCvToJobDescription(base, advert);
    const found = new Map(result.matchedKeywords.map((k) => [k.keyword, k.foundIn]));
    assert.deepEqual(found.get("React"), ["Work history", "Tech Skills"]);
    assert.deepEqual(found.get("PostgreSQL"), ["Work history"]);
    assert.deepEqual(found.get("TypeScript"), ["Tech Skills"]);
  });

  test("suggests the user's own section title for missing keywords", () => {
    const result = matchCvToJobDescription(base, advert);
    assert.deepEqual(result.missingKeywords, [
      { keyword: "Kubernetes", weight: 1.5, suggestedSection: "Tech Skills" },
    ]);
  });

  test("scores the weighted share of keywords found (0-100)", () => {
    assert.equal(matchCvToJobDescription(base, advert).score, 75);
    assert.equal(matchCvToJobDescription(cv([]), advert).score, 0);
    assert.equal(matchCvToJobDescription(base, "React and TypeScript").score, 100);
    assert.equal(matchCvToJobDescription(base, "").score, 0);
  });

  test("is fast on pathological input", () => {
    const nasty = [
      "a".repeat(20_000),
      ".".repeat(19_999) + "a",
      "![".repeat(10_000),
      " ".repeat(20_000),
      "-".repeat(20_000),
      "| ".repeat(10_000),
      "@".repeat(20_000),
      "go ".repeat(6_000),
      "React\n".repeat(3_000),
      "x@y.".repeat(5_000),
    ];
    const started = performance.now();
    for (const text of nasty) {
      matchCvToJobDescription(
        cv(Array.from({ length: 30 }, () => ({ title: text.slice(0, 200), sectionType: "custom", content: text.slice(0, 15_000) }))),
        text,
      );
    }
    const elapsed = performance.now() - started;
    assert.ok(elapsed < 3_000, `took ${Math.round(elapsed)}ms`);
  });
});

describe("runAtsChecks", () => {
  const byKey = (checks: ReturnType<typeof runAtsChecks>) =>
    Object.fromEntries(checks.map((c) => [c.key, c.passed]));
  const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");

  test("passes a clean, complete CV", () => {
    const checks = byKey(
      runAtsChecks(
        cv([
          { title: "Profile", sectionType: "profile", content: "Developer." },
          { title: "Experience", sectionType: "experience", content: `### Acme | Dev | 2020 – Present\n${words(400)}` },
          { title: "Skills", sectionType: "skills", content: "TypeScript" },
        ]),
      ),
    );
    assert.deepEqual(Object.values(checks).filter((passed) => !passed), []);
  });

  test("flags missing contact, sections, dates, length, tables, photo and odd headings", () => {
    const checks = byKey(
      runAtsChecks(
        cv(
          [
            { title: "My journey", sectionType: "experience", content: "Did things\n| a | b |\n| --- | --- |" },
            { title: "Pic", sectionType: "custom", content: "![me](x.png)" },
          ],
          { email: null, phone: "", photoUrl: "https://x/me.png" },
        ),
      ),
    );
    assert.deepEqual(checks, {
      contact_email: false,
      contact_phone: false,
      profile: false,
      experience_dates: false,
      skills: false,
      length: false,
      formatting: false,
      photo: false,
      standard_headings: false,
    });
  });

  test("finds an email written in the CV text", () => {
    const checks = byKey(
      runAtsChecks(cv([{ title: "Contact", sectionType: "custom", content: "Email: jane@example.com" }], { email: null })),
    );
    assert.equal(checks.contact_email, true);
  });
});
