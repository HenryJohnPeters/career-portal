import { test } from "node:test";
import assert from "node:assert/strict";
import { hasDotSegment } from "./api-path";

test("hasDotSegment catches every spelling fetch would resolve", () => {
  assert.equal(hasDotSegment("/jobs/../account/export"), true);
  assert.equal(hasDotSegment("/jobs/./x"), true);
  assert.equal(hasDotSegment("/jobs/%2e%2e/account/export"), true);
  assert.equal(hasDotSegment("/jobs/.%2E/account"), true);
  assert.equal(hasDotSegment("/jobs/..\\account\\export"), true);
  assert.equal(hasDotSegment("/jobs/.."), true);
  assert.equal(hasDotSegment("/jobs/%E0%A4%A"), true, "malformed encoding is refused");
});

test("hasDotSegment allows normal paths, queries and dotted names", () => {
  assert.equal(hasDotSegment("/jobs/3f2504e0-4f89-41d3-9a0c-0305e82c3301"), false);
  assert.equal(hasDotSegment("/cover-letters?summary=1"), false);
  assert.equal(hasDotSegment("/pdf/cv/abc?download=1&next=../x"), false);
  assert.equal(hasDotSegment("/files/report.v2.json"), false);
  assert.equal(hasDotSegment("/jobs/..%2Faccount"), false, "one encoded segment, not a dot segment");
});
