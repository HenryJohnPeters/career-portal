import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { contentDisposition, pdfFilename, sanitizeFilenamePart } from "./pdf-filename";

describe("pdfFilename", () => {
  test("builds '<Name> - <Label>.pdf'", () => {
    assert.equal(pdfFilename("Jane Doe", "CV"), "Jane Doe - CV.pdf");
    assert.equal(pdfFilename("  Jane   Doe ", "Cover Letter"), "Jane Doe - Cover Letter.pdf");
  });

  test("falls back to the label when the name is empty", () => {
    assert.equal(pdfFilename("", "CV"), "CV.pdf");
    assert.equal(pdfFilename(null, "CV"), "CV.pdf");
    assert.equal(pdfFilename("///", "CV"), "CV.pdf");
  });
});

describe("sanitizeFilenamePart", () => {
  test("removes path, reserved and control characters", () => {
    assert.equal(sanitizeFilenamePart('../a/b\\c:d*e?"f<g>h|i'), "a b c d e f g h i");
    assert.equal(sanitizeFilenamePart("a\r\nb\u0000c‮d"), "abcd");
  });

  test("drops lone surrogates and caps the length", () => {
    assert.equal(sanitizeFilenamePart("a\ud800b"), "ab");
    assert.equal(Array.from(sanitizeFilenamePart("é".repeat(200))).length, 80);
  });
});

describe("contentDisposition", () => {
  test("has an ASCII fallback and an RFC 5987 UTF-8 name", () => {
    assert.equal(
      contentDisposition("attachment", "Zoë O'Brien (2) - CV.pdf"),
      `attachment; filename="Zoe O'Brien (2) - CV.pdf"; filename*=UTF-8''Zo%C3%AB%20O%27Brien%20%282%29%20-%20CV.pdf`,
    );
  });

  test("handles names with no ASCII letters", () => {
    assert.equal(
      contentDisposition("inline", "李雷 - CV.pdf"),
      `inline; filename="CV.pdf"; filename*=UTF-8''%E6%9D%8E%E9%9B%B7%20-%20CV.pdf`,
    );
  });

  test("never lets a quote or semicolon break the header", () => {
    const header = contentDisposition("attachment", 'a"; filename=evil.exe; x="');
    assert.match(header, /^attachment; filename="[^"]*"; filename\*=UTF-8''[^\s";]+$/);
  });
});
