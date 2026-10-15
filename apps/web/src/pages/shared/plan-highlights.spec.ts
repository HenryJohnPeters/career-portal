import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { FREE_TIER, PLAN_FEATURES } from "@careerportal/shared/types";
import { planFeatureText, planHighlights } from "./plan-highlights";

describe("planFeatureText", () => {
  const row = (key: string) => {
    const found = PLAN_FEATURES.find((r) => r.key === key);
    assert.ok(found, key);
    return found;
  };

  test("strings show the value, true shows the label, false is omitted", () => {
    assert.equal(planFeatureText(row("cvVersions"), "free"), `CV versions: ${FREE_TIER.cvVersions}`);
    assert.equal(planFeatureText(row("tailorKit"), "premium"), row("tailorKit").label);
    assert.equal(planFeatureText(row("tailorKit"), "free"), null);
  });
});

describe("planHighlights", () => {
  test("keeps the requested order and drops features the plan lacks", () => {
    const lines = planHighlights("free", ["aiActions", "tailorKit", "jobTracker"]);
    assert.deepEqual(lines, [
      `AI writing & job-description analysis: ${FREE_TIER.monthlyAiActions} / month`,
      "Job application tracker: Unlimited",
    ]);
  });
});
