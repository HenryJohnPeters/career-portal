import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { MAX_SELECTED_TAGS, isKnownTag, normalizeTag } from "@careerportal/shared/types";
import { ROLE_TECH_PATHWAYS, TRACK_TO_ROLE_FOCUS, findTrackForTag, getRoleTags } from "./tech-pathways";
import { addTagsToSelection, removeTagsFromSelection, toggleTagSelection } from "./tag-selection";

describe("tech pathways", () => {
  test("every pathway tag is a canonical catalog id", () => {
    for (const [role, pathways] of Object.entries(ROLE_TECH_PATHWAYS)) {
      for (const pathway of pathways) {
        for (const tag of pathway.tags) {
          assert.ok(isKnownTag(tag), `${role}/${pathway.key}: unknown tag "${tag}"`);
          assert.equal(normalizeTag(tag), tag, `${role}/${pathway.key}: "${tag}" is not the canonical id`);
        }
        assert.equal(new Set(pathway.tags).size, pathway.tags.length, `${pathway.key} has duplicates`);
      }
    }
  });

  test("pathway keys are unique across roles", () => {
    const keys = Object.values(ROLE_TECH_PATHWAYS).flatMap((p) => p.map((x) => x.key));
    assert.equal(new Set(keys).size, keys.length);
  });

  test("every track maps to a role with pathways", () => {
    for (const role of Object.values(TRACK_TO_ROLE_FOCUS)) {
      assert.ok(ROLE_TECH_PATHWAYS[role].length > 0);
    }
    assert.equal(TRACK_TO_ROLE_FOCUS.devops, "platform");
  });

  test("findTrackForTag keeps the current track when it lists the tag", () => {
    assert.ok(getRoleTags("backend").has("redis"));
    assert.equal(findTrackForTag("redis", "backend"), "backend");
    assert.equal(findTrackForTag("redis", "fullstack"), "fullstack");
    assert.equal(findTrackForTag("terraform", "frontend"), "devops");
    assert.equal(findTrackForTag("not-a-tag", "frontend"), "frontend");
  });

  test("a legacy alias resolves to a track once normalised (Practise this topic)", () => {
    assert.equal(findTrackForTag(normalizeTag("nodejs"), "frontend"), "backend");
    assert.equal(findTrackForTag(normalizeTag("golang"), "frontend"), "backend");
  });
});

describe("tag selection", () => {
  test("toggle adds canonical ids and removes selected ones", () => {
    assert.deepEqual(toggleTagSelection([], "React"), { tags: ["react"], limited: false });
    assert.deepEqual(toggleTagSelection(["react"], "react"), { tags: [], limited: false });
    assert.deepEqual(toggleTagSelection([], "Accessibility (a11y)").tags, ["accessibility"]);
  });

  test("toggle refuses to exceed the cap but still allows removal", () => {
    const full = Array.from({ length: MAX_SELECTED_TAGS }, (_, i) => `t${i}`);
    const added = toggleTagSelection(full, "react");
    assert.equal(added.limited, true);
    assert.equal(added.tags.length, MAX_SELECTED_TAGS);
    assert.equal(toggleTagSelection(full, "t3").tags.length, MAX_SELECTED_TAGS - 1);
  });

  test("addTagsToSelection fills up to the cap and reports the overflow", () => {
    assert.deepEqual(addTagsToSelection(["a"], ["b", "a", "c"], 3), { tags: ["a", "b", "c"], limited: false });
    assert.deepEqual(addTagsToSelection(["a"], ["b", "c", "d"], 3), { tags: ["a", "b", "c"], limited: true });
  });

  test("removeTagsFromSelection removes only the given tags", () => {
    assert.deepEqual(removeTagsFromSelection(["react", "vue", "go"], ["vue", "go"]), ["react"]);
  });
});
