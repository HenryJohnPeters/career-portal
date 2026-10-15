import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCoverLetterPrompt,
  buildRewritePrompt,
  buildSuggestPrompt,
  letterContentSchema,
  suggestionsSchema,
} from "./cover-letter.prompts";

const cvSections = [{ title: "Experience", sectionType: "experience", content: "Acme 2020" }];

describe("buildCoverLetterPrompt", () => {
  test("useCv: false never sends CV data", () => {
    const prompt = buildCoverLetterPrompt({ action: "generate", cvSections, useCv: false });
    assert.ok(!prompt.user.includes("Acme"));
    assert.ok(!prompt.user.includes("<cv>"));
  });

  test("CV data is sent by default, inside a data block", () => {
    const prompt = buildCoverLetterPrompt({ action: "generate", cvSections });
    assert.ok(prompt.user.includes("<cv>\n[Experience]\nAcme 2020\n</cv>"));
    assert.ok(!prompt.system.includes("Acme"));
  });

  test("improve sends the editor body; generate treats it as notes", () => {
    const improve = buildCoverLetterPrompt({ action: "improve", currentBody: "Dear team" });
    assert.ok(improve.user.includes("<cover_letter>\nDear team\n</cover_letter>"));
    const generate = buildCoverLetterPrompt({ action: "generate", currentBody: "Mention Rust" });
    assert.ok(generate.user.includes("<notes>\nMention Rust\n</notes>"));
  });

  test("never interpolates undefined", () => {
    const prompt = buildCoverLetterPrompt({ action: "generate" });
    assert.ok(!prompt.user.includes("undefined"));
    assert.ok(!prompt.system.includes("undefined"));
  });

  test("keeps a long letter whole and flags only bodies over the limit", () => {
    assert.equal(
      buildCoverLetterPrompt({ action: "tailor", currentBody: "x".repeat(15_000), jobTitle: "Dev" }).truncated,
      false,
    );
    assert.equal(
      buildCoverLetterPrompt({ action: "improve", currentBody: "x".repeat(15_001) }).truncated,
      true,
    );
  });

  test("unknown tones fall back to professional", () => {
    const prompt = buildCoverLetterPrompt({
      action: "generate",
      tone: "constructor" as unknown as "friendly",
    });
    assert.ok(prompt.system.includes("Polished, formal tone."));
  });
});

describe("suggest and rewrite prompts", () => {
  test("wrap the letter in a data block", () => {
    assert.ok(buildSuggestPrompt({ body: "Hi" }).user.includes("<cover_letter>\nHi\n</cover_letter>"));
    const rewrite = buildRewritePrompt({ body: "Hi", tone: "friendly", jobTitle: "Dev", companyName: "Acme" });
    assert.ok(rewrite.user.includes("for the Dev role at Acme"));
    assert.ok(rewrite.system.includes("Warm, personable"));
  });
});

describe("suggestionsSchema", () => {
  test("keeps strings only (objects would crash the UI), capped at 6", () => {
    const parsed = suggestionsSchema.safeParse({
      suggestions: ["One", { suggestion: "obj" }, 3, " Two ", "", ...Array(10).fill("x")],
    });
    assert.ok(parsed.success);
    assert.deepEqual(parsed.data, ["One", "Two", "x"]);
  });

  test("fails when nothing usable remains", () => {
    assert.equal(suggestionsSchema.safeParse({ suggestions: [{}] }).success, false);
    assert.equal(suggestionsSchema.safeParse({ suggestions: "text" }).success, false);
  });
});

describe("letterContentSchema", () => {
  test("rejects an empty letter", () => {
    assert.equal(letterContentSchema.safeParse({ content: "" }).success, false);
    assert.equal(letterContentSchema.safeParse({ content: "Dear…" }).data, "Dear…");
  });
});
