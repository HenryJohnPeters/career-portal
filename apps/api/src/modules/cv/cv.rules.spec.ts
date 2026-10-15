import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { CV_LIMITS, SECTION_TYPES, normalizeContactUrl, toSectionType } from "./cv.rules";

const libsDir = resolve(__dirname, "../../../../../libs/shared/types/src");
const libsCv = require(resolve(libsDir, "cv")) as { CV_LIMITS: unknown };
const libsTemplates = require(resolve(libsDir, "cv-templates")) as {
  SECTION_TYPES: { type: string }[];
};

describe("mirrors of libs/shared/types", () => {
  test("CV_LIMITS match", () => {
    assert.deepEqual({ ...CV_LIMITS }, libsCv.CV_LIMITS);
  });

  test("section types match", () => {
    assert.deepEqual([...SECTION_TYPES], libsTemplates.SECTION_TYPES.map((s) => s.type));
  });
});

describe("toSectionType", () => {
  test("keeps known types (case/space-insensitive)", () => {
    assert.equal(toSectionType(" Experience "), "experience");
  });

  test("coerces anything else to custom", () => {
    for (const raw of ["summary", "", null, 7, "x".repeat(500)]) {
      assert.equal(toSectionType(raw), "custom");
    }
  });
});

describe("normalizeContactUrl", () => {
  test("adds https:// to bare domains", () => {
    assert.equal(normalizeContactUrl("website", " example.com "), "https://example.com");
    assert.equal(normalizeContactUrl("linkedin", "linkedin.com/in/jane"), "https://linkedin.com/in/jane");
    assert.equal(normalizeContactUrl("github", "//github.com/jane"), "https://github.com/jane");
  });

  test("keeps http(s) URLs as typed", () => {
    assert.equal(normalizeContactUrl("website", "HTTP://Example.com/a"), "HTTP://Example.com/a");
  });

  test("turns bare handles into profile URLs", () => {
    assert.equal(normalizeContactUrl("linkedin", "jane-doe"), "https://linkedin.com/in/jane-doe");
    assert.equal(normalizeContactUrl("github", "@octocat"), "https://github.com/octocat");
    assert.equal(normalizeContactUrl("website", "jane"), "https://jane");
  });

  test("blank input gives an empty string", () => {
    assert.equal(normalizeContactUrl("website", "   "), "");
  });

  test("other schemes cannot survive as a scheme", () => {
    assert.ok(normalizeContactUrl("website", "javascript:alert(1)").startsWith("https://"));
  });
});
