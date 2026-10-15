import { test } from "node:test";
import assert from "node:assert/strict";
import { idParam, isUuid } from "./ids";

test("idParam keeps UUIDs and drops anything else", () => {
  const id = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
  assert.equal(idParam(id), id);
  assert.equal(idParam(id.toUpperCase()), id.toUpperCase());
  assert.equal(idParam("../account/export"), null);
  assert.equal(idParam(`${id}/../../account/export`), null);
  assert.equal(idParam(""), null);
  assert.equal(idParam(null), null);
  assert.equal(idParam(undefined), null);
  assert.equal(isUuid(42), false);
});
