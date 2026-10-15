import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildSnapshot, parseSnapshot, pickContact, snapshotToJson } from "./cv-snapshot";

const contact = pickContact({ name: "Jane", email: "jane@example.com", website: null });

describe("cv snapshots", () => {
  test("round-trip through JSON", () => {
    const snapshot = buildSnapshot(
      contact,
      [{ title: "Profile", content: "Hi", sectionType: "profile" }],
      new Date("2026-01-01T00:00:00Z"),
    );
    const parsed = parseSnapshot(JSON.parse(JSON.stringify(snapshotToJson(snapshot))));
    assert.deepEqual(parsed, snapshot);
  });

  test("pickContact keeps every field, strings only", () => {
    assert.deepEqual(pickContact({ name: "J", phone: 5 as unknown as string }), {
      name: "J",
      email: null,
      photoUrl: null,
      phone: null,
      location: null,
      website: null,
      linkedin: null,
      github: null,
    });
  });

  test("legacy section types are coerced", () => {
    const parsed = parseSnapshot({
      contact: {},
      sections: [{ title: "Summary", content: "x", sectionType: "summary" }],
    });
    assert.equal(parsed?.sections[0].sectionType, "custom");
  });

  test("malformed snapshots read as missing", () => {
    for (const value of [
      null,
      "x",
      [],
      { contact: {} },
      { sections: [] },
      { contact: {}, sections: [{ title: 1, content: "x" }] },
    ]) {
      assert.equal(parseSnapshot(value as never), null, JSON.stringify(value));
    }
  });
});
