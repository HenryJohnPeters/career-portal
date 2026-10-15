import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { toStorableText } from "./storable-text";

describe("toStorableText", () => {
  test("leaves ordinary text, emoji and other control characters alone", () => {
    for (const text of ["", "plain", "café — naïve", "emoji 😀 ok", "tab\tline\nbreak", " "]) {
      assert.equal(toStorableText(text), text);
    }
  });

  test("removes NUL characters", () => {
    assert.equal(toStorableText("abc\u0000def\u0000"), "abcdef");
  });

  test("replaces lone surrogates with U+FFFD and keeps valid pairs", () => {
    assert.equal(toStorableText("\ud800 lone"), "\uFFFD lone");
    assert.equal(toStorableText("cut \ud83d"), "cut \uFFFD");
    assert.equal(toStorableText("\ude00 low first"), "\uFFFD low first");
    assert.equal(toStorableText("pair 😀 \udc00\ud800"), "pair 😀 \uFFFD\uFFFD");
  });

  test("matches String.prototype.toWellFormed for surrogates", () => {
    const samples = ["\ud800𐀀", "\udfff\ud800", "a😀b\ud83d"];
    for (const text of samples) {
      const expected = (text as unknown as { toWellFormed(): string }).toWellFormed();
      assert.equal(toStorableText(text), expected);
    }
  });
});
