import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { AiFullCvResult } from "@careerportal/shared/types";
import {
  normaliseUrl,
  toContactPatchValue,
  validateContactField,
  validateEmail,
  validateUrl,
} from "./contact";
import { coerceSectionType, toApplyCvContent, validateSectionFields } from "./cv-content";
import { applyFormat, BOLD } from "./markdown-format";
import { toSafeFilename } from "./files";

describe("contact fields", () => {
  test("normaliseUrl adds https:// only when the scheme is missing", () => {
    assert.equal(normaliseUrl("linkedin.com/in/jane"), "https://linkedin.com/in/jane");
    assert.equal(normaliseUrl("  http://jane.dev "), "http://jane.dev");
    assert.equal(normaliseUrl("//github.com/jane"), "https://github.com/jane");
    assert.equal(normaliseUrl("   "), "");
  });

  test("bare LinkedIn/GitHub handles become profile URLs, as the API does", () => {
    assert.equal(normaliseUrl("jane-doe", "linkedin"), "https://linkedin.com/in/jane-doe");
    assert.equal(normaliseUrl("@jane", "github"), "https://github.com/jane");
    assert.equal(normaliseUrl("jane-doe", "website"), "https://jane-doe");
    assert.equal(validateContactField("linkedin", "jane-doe"), null);
    assert.equal(toContactPatchValue("github", "jane"), "https://github.com/jane");
    assert.ok(validateContactField("website", "jane-doe"), "a website still needs a domain");
  });

  test("validateUrl mirrors the API rule (http/https, dotted host, real TLD)", () => {
    assert.equal(validateUrl("linkedin.com/in/jane"), null);
    assert.equal(validateUrl(""), null, "empty clears the field");
    assert.ok(validateUrl("linkedin"), "no TLD");
    assert.ok(validateUrl("linkedin.c"), "one-letter TLD while typing");
    assert.ok(validateUrl("javascript:alert(1)"));
    assert.ok(validateUrl("ftp://files.example.com"));
    assert.ok(validateUrl("jane dev.com"));
    assert.ok(validateUrl(`example.com/${"a".repeat(500)}`));
  });

  test("validateEmail allows empty (clear) and rejects partial addresses", () => {
    assert.equal(validateEmail(""), null);
    assert.equal(validateEmail("jane@example.com"), null);
    assert.ok(validateEmail("jane@"));
    assert.ok(validateEmail("jane@example"));
  });

  test("other fields are checked against the server length limits", () => {
    assert.equal(validateContactField("phone", "+44 7700 900123"), null);
    assert.ok(validateContactField("phone", "1".repeat(51)));
    assert.equal(toContactPatchValue("github", "github.com/jane"), "https://github.com/jane");
    assert.equal(toContactPatchValue("name", "  Jane  "), "Jane");
  });
});

describe("toApplyCvContent", () => {
  const base: AiFullCvResult = {
    name: " Jane Doe ",
    email: "not-an-email",
    phone: "",
    location: "London",
    website: "jane.dev",
    linkedin: "linkedin.com/in/jane",
    github: "",
    sections: [
      { title: "About", sectionType: "Profile", content: "Engineer" },
      { title: "Odd", sectionType: "weird", content: "Stuff" },
      { title: "Empty", sectionType: "skills", content: "   " },
    ],
  };

  test("keeps valid contact fields, normalises URLs and skips invalid ones", () => {
    const body = toApplyCvContent(base)!;
    assert.deepEqual(body.contact, {
      name: "Jane Doe",
      location: "London",
      website: "https://jane.dev",
      linkedin: "https://linkedin.com/in/jane",
    });
  });

  test("drops empty sections and coerces section types", () => {
    const body = toApplyCvContent(base)!;
    assert.deepEqual(
      body.sections.map((s) => [s.title, s.sectionType]),
      [
        ["About", "profile"],
        ["Odd", "custom"],
      ],
    );
  });

  test("clamps to the API limits", () => {
    const body = toApplyCvContent({
      ...base,
      sections: Array.from({ length: 40 }, (_, i) => ({
        title: "T".repeat(300),
        sectionType: "custom",
        content: `${i}${"x".repeat(20_000)}`,
      })),
    })!;
    assert.equal(body.sections.length, 30);
    assert.equal(body.sections[0].title.length, 200);
    assert.equal(body.sections[0].content.length, 15_000);
  });

  test("returns null when nothing usable came back", () => {
    assert.equal(toApplyCvContent({ ...base, sections: [] }), null);
  });

  test("coerceSectionType falls back to the title", () => {
    assert.equal(coerceSectionType(undefined, "Work Experience"), "experience");
    assert.equal(coerceSectionType("SKILLS", "Whatever"), "skills");
  });

  test("validateSectionFields blocks empty titles and over-long content", () => {
    assert.equal(validateSectionFields({ title: "Skills", content: "x" }), null);
    assert.ok(validateSectionFields({ title: " ", content: "x" }));
    assert.ok(validateSectionFields({ title: "Skills", content: "x".repeat(15_001) }));
  });
});

describe("applyFormat", () => {
  test("wraps the selection, or a placeholder when nothing is selected", () => {
    assert.deepEqual(applyFormat("hello world", 6, 11, BOLD), {
      value: "hello **world**",
      selectionStart: 8,
      selectionEnd: 13,
    });
    assert.equal(applyFormat("", 0, 0, BOLD).value, "**text**");
  });

  test("toggles a line prefix", () => {
    const on = applyFormat("one\ntwo", 5, 5, { type: "line-prefix", prefix: "- " });
    assert.equal(on.value, "one\n- two");
    const off = applyFormat(on.value, 7, 7, { type: "line-prefix", prefix: "- " });
    assert.equal(off.value, "one\ntwo");
  });
});

describe("toSafeFilename", () => {
  test("removes path and reserved characters", () => {
    assert.equal(toSafeFilename("../Acme: Letter?", "txt"), "Acme Letter.txt");
    assert.equal(toSafeFilename("   ", "txt", "Cover letter"), "Cover letter.txt");
  });
});
