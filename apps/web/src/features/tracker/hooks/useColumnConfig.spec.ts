import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseColumnConfig } from "./useColumnConfig";

const ALL = [
  "wishlist",
  "applied",
  "phone_screen",
  "technical_interview",
  "onsite",
  "tech_test",
  "accepted",
  "rejected",
];

describe("parseColumnConfig", () => {
  test("defaults to every column when nothing valid is stored", () => {
    assert.deepEqual(parseColumnConfig(null), ALL);
    assert.deepEqual(parseColumnConfig("not json"), ALL);
    assert.deepEqual(parseColumnConfig("null"), ALL);
    assert.deepEqual(parseColumnConfig('{"visibleIds":"applied"}'), ALL);
    assert.deepEqual(parseColumnConfig('{"visibleIds":["nope", 3]}'), ALL);
  });

  test("keeps known ids in the stored order without duplicates", () => {
    assert.deepEqual(
      parseColumnConfig('{"visibleIds":["onsite","applied","onsite","ghosted","applied"]}'),
      ["onsite", "applied"],
    );
  });
});
