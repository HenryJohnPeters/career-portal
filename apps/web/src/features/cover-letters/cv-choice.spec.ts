import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { ACTIVE_CV, NO_CV, cvChoiceToRequest } from "./cv-choice";
import { validateLetterFields } from "./letter-fields";

describe("cvChoiceToRequest", () => {
  test("'Don't use CV data' never sends CV data", () => {
    assert.deepEqual(cvChoiceToRequest(NO_CV), { useCv: false });
  });

  test("the default uses the active CV; a version id picks that CV", () => {
    assert.deepEqual(cvChoiceToRequest(ACTIVE_CV), { useCv: true });
    assert.deepEqual(cvChoiceToRequest("cv-1"), { useCv: true, cvVersionId: "cv-1" });
  });
});

describe("validateLetterFields", () => {
  test("requires a title and enforces the API limits", () => {
    assert.equal(validateLetterFields({ title: "Acme", body: "" }), null);
    assert.ok(validateLetterFields({ title: "  ", body: "x" }));
    assert.ok(validateLetterFields({ title: "t".repeat(201), body: "x" }));
    assert.ok(validateLetterFields({ title: "Acme", body: "x".repeat(15_001) }));
  });
});
