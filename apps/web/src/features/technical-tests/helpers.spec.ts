import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseInlineMarkdown } from "./inline-markdown";
import { countWords, formatDuration, getSoftTimer } from "./timer";

describe("parseInlineMarkdown", () => {
  test("splits bold and code segments", () => {
    assert.deepEqual(parseInlineMarkdown("Build it using **React** and `useState` today"), [
      { type: "text", text: "Build it using " },
      { type: "strong", text: "React" },
      { type: "text", text: " and " },
      { type: "code", text: "useState" },
      { type: "text", text: " today" },
    ]);
  });

  test("keeps unmatched markers and HTML as plain text", () => {
    assert.deepEqual(parseInlineMarkdown("2 ** 3 and <b>x</b>"), [{ type: "text", text: "2 ** 3 and <b>x</b>" }]);
    assert.deepEqual(parseInlineMarkdown("`unclosed"), [{ type: "text", text: "`unclosed" }]);
  });

  test("handles adjacent markers and empty input", () => {
    assert.deepEqual(parseInlineMarkdown("**a**`b`"), [
      { type: "strong", text: "a" },
      { type: "code", text: "b" },
    ]);
    assert.deepEqual(parseInlineMarkdown(""), []);
  });
});

describe("soft timer", () => {
  const start = "2026-10-15T10:00:00.000Z";
  const at = (iso: string) => Date.parse(iso);

  test("tracks elapsed and remaining time against the limit", () => {
    const state = getSoftTimer(start, 60, at("2026-10-15T10:20:30.000Z"));
    assert.deepEqual(state, { elapsedMs: 1_230_000, limitMs: 3_600_000, remainingMs: 2_370_000, overLimit: false });
  });

  test("flags time beyond the suggested limit without going negative", () => {
    const state = getSoftTimer(start, 30, at("2026-10-15T10:45:00.000Z"));
    assert.equal(state?.overLimit, true);
    assert.equal(state?.remainingMs, 0);
  });

  test("works without a limit and rejects missing start times", () => {
    assert.equal(getSoftTimer(start, 0, at(start))?.limitMs, null);
    assert.equal(getSoftTimer(null, 60, Date.now()), null);
    assert.equal(getSoftTimer("not a date", 60, Date.now()), null);
  });

  test("formats durations", () => {
    assert.equal(formatDuration(0), "0:00");
    assert.equal(formatDuration(245_000), "4:05");
    assert.equal(formatDuration(3_909_000), "1:05:09");
    assert.equal(formatDuration(-5), "0:00");
  });

  test("counts words", () => {
    assert.equal(countWords("  one two\nthree  "), 3);
    assert.equal(countWords(""), 0);
  });
});
