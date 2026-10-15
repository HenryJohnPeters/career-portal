import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { TRUNCATION_MARKER } from "../ai-json";
import { buildCvContext, normaliseEmail, normaliseUrl, toSectionType } from "./shared";

describe("toSectionType", () => {
  test("keeps known types (case-insensitive) and maps anything else to custom", () => {
    assert.equal(toSectionType("Experience"), "experience");
    assert.equal(toSectionType("skills"), "skills");
    assert.equal(toSectionType("a".repeat(90_000)), "custom");
    assert.equal(toSectionType(undefined), "custom");
  });
});

describe("buildCvContext", () => {
  const section = (title: string, sectionType: string, content: string) => ({
    title,
    sectionType,
    content,
  });

  test("puts profile, experience and skills first and skips empty sections", () => {
    const context = buildCvContext([
      section("Hobbies", "interests", "Climbing"),
      section("Empty", "projects", "   "),
      section("Skills", "skills", "TypeScript"),
      section("About me", "profile", "Engineer"),
    ]);
    assert.equal(context, "[About me]\nEngineer\n\n[Skills]\nTypeScript\n\n[Hobbies]\nClimbing");
  });

  test("caps the number of sections", () => {
    const many = Array.from({ length: 20 }, (_, i) => section(`S${i}`, "custom", "x"));
    const context = buildCvContext(many, { maxSections: 3, perSectionChars: 100, totalChars: 1_000 });
    assert.equal(context.split("\n\n").length, 3);
  });

  test("caps each section and the total, marking cut text", () => {
    const big = "y".repeat(5_000);
    const context = buildCvContext(
      [section("A", "profile", big), section("B", "experience", big), section("C", "skills", big)],
      { maxSections: 10, perSectionChars: 1_500, totalChars: 2_000 },
    );
    assert.ok(context.includes(TRUNCATION_MARKER));
    assert.ok(!context.includes("[C]"));
    assert.ok(context.length < 2_200);
  });

  test("returns an empty string for no sections", () => {
    assert.equal(buildCvContext(undefined), "");
    assert.equal(buildCvContext([]), "");
  });
});

describe("normaliseUrl / normaliseEmail", () => {
  test("adds https:// when the scheme is missing", () => {
    assert.equal(normaliseUrl("linkedin.com/in/jane"), "https://linkedin.com/in/jane");
    assert.equal(normaliseUrl("https://github.com/jane"), "https://github.com/jane");
  });

  test("drops values that are not plausible http(s) links", () => {
    assert.equal(normaliseUrl("javascript://alert(1)"), "");
    assert.equal(normaliseUrl("not a url"), "");
    assert.equal(normaliseUrl("localhost"), "");
    assert.equal(normaliseUrl(""), "");
  });

  test("keeps only email-shaped values", () => {
    assert.equal(normaliseEmail(" jane@example.com "), "jane@example.com");
    assert.equal(normaliseEmail("jane at example"), "");
  });
});
