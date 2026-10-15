import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getUpgradeCopy } from "./upgrade-copy";

describe("getUpgradeCopy", () => {
  test("monthly quota with details", () => {
    const copy = getUpgradeCopy({
      reason: "quota_exceeded",
      quota: "aiActions",
      limit: 10,
      resetsAt: "2026-11-01T00:00:00.000Z",
    });
    assert.equal(copy.title, "You've used all 10 AI actions this month");
    assert.match(copy.description, /includes 10 AI actions a month/);
    assert.equal(copy.benefits.length, 3);
  });

  test("total (non-monthly) quota", () => {
    const copy = getUpgradeCopy({
      reason: "quota_exceeded",
      quota: "cvVersions",
      limit: 2,
      resetsAt: null,
    });
    assert.equal(copy.title, "You've reached the free limit of 2 CV versions");
    assert.doesNotMatch(copy.description, /a month/);
  });

  test("quota without a limit falls back to the server message", () => {
    const copy = getUpgradeCopy({
      reason: "quota_exceeded",
      quota: "techTests",
      message: "You've used your free technical tests.",
    });
    assert.equal(copy.title, "You've reached your free technical tests limit");
    assert.equal(copy.description, "You've used your free technical tests.");
  });

  test("premium feature", () => {
    const copy = getUpgradeCopy({ reason: "premium_required", feature: "tailorKit" });
    assert.equal(copy.title, "Tailor-for-this-job kit is a Premium feature");
    assert.ok(copy.description.length > 0);
  });

  test("premium feature keeps the server's specific guidance, not its generic default", () => {
    const template = getUpgradeCopy({
      reason: "premium_required",
      feature: "templates",
      message: "This CV uses a Premium template. Upgrade, or switch to a free template to download it.",
    });
    assert.match(template.description, /switch to a free template/);

    const generic = getUpgradeCopy({
      reason: "premium_required",
      feature: "templates",
      message: "All CV templates is available on Premium. Upgrade to unlock it.",
    });
    const plain = getUpgradeCopy({ reason: "premium_required", feature: "templates" });
    assert.equal(generic.description, plain.description);
  });

  test("unknown shape still produces usable copy", () => {
    const copy = getUpgradeCopy({ reason: "premium_required" });
    assert.equal(copy.title, "Upgrade to Premium");
  });

  test("unknown quota / feature keys from the API fall back to generic copy", () => {
    const quota = getUpgradeCopy({
      reason: "quota_exceeded",
      quota: "somethingNew" as never,
      limit: 3,
      message: "Limit reached.",
    });
    assert.equal(quota.title, "Upgrade to Premium");
    assert.equal(quota.description, "Limit reached.");
    assert.ok(Array.isArray(quota.benefits) && quota.benefits.length > 0);

    const inherited = getUpgradeCopy({ reason: "quota_exceeded", quota: "toString" as never });
    assert.equal(inherited.title, "Upgrade to Premium");

    const feature = getUpgradeCopy({ reason: "premium_required", feature: "somethingNew" as never });
    assert.equal(feature.title, "Upgrade to Premium");
    assert.ok(Array.isArray(feature.benefits) && feature.benefits.length > 0);
  });
});
