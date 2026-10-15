import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  buildOnboardingSteps,
  buildPipeline,
  followUpHorizon,
  interviewTitle,
  jobTitle,
  mergeRecentActivity,
  staleCutoff,
  type RecentActivityItem,
} from "./dashboard.summary";

describe("buildPipeline", () => {
  test("has every status, folds legacy values in", () => {
    assert.deepEqual(
      buildPipeline([
        { status: "applied", count: 3 },
        { status: "saved", count: 2 },
        { status: "wishlist", count: 1 },
        { status: "offer", count: 1 },
        { status: "something-odd", count: 1 },
      ]),
      {
        wishlist: 3,
        applied: 4,
        phone_screen: 0,
        technical_interview: 0,
        onsite: 0,
        tech_test: 0,
        accepted: 1,
        rejected: 0,
      },
    );
  });
});

describe("mergeRecentActivity", () => {
  const item = (type: RecentActivityItem["type"], id: string, iso: string): RecentActivityItem => ({
    type,
    id,
    title: id,
    updatedAt: new Date(iso),
  });

  test("merges all types newest first and caps the total", () => {
    const merged = mergeRecentActivity(
      [
        [item("cv", "cv1", "2026-10-10T00:00:00Z")],
        [item("job", "job1", "2026-10-12T00:00:00Z"), item("job", "job2", "2026-10-01T00:00:00Z")],
        [item("interview", "s1", "2026-10-11T00:00:00Z")],
      ],
      3,
    );
    assert.deepEqual(
      merged.map((m) => m.id),
      ["job1", "s1", "cv1"],
    );
  });
});

describe("titles", () => {
  test("interview and job titles", () => {
    assert.equal(
      interviewTitle({ track: "frontend", interviewType: "system-design" }),
      "Frontend system design interview",
    );
    assert.equal(jobTitle({ company: "Acme", role: "Engineer" }), "Acme — Engineer");
  });
});

describe("action centre windows", () => {
  test("follow-ups look 7 days ahead; applications go stale after 14 days", () => {
    const now = new Date("2026-10-15T12:00:00Z");
    assert.equal(followUpHorizon(now).toISOString(), "2026-10-22T12:00:00.000Z");
    assert.equal(staleCutoff(now).toISOString(), "2026-10-01T12:00:00.000Z");
  });
});

describe("buildOnboardingSteps", () => {
  test("derives each step from the facts, in order", () => {
    assert.deepEqual(
      buildOnboardingSteps({
        cvVersions: 1,
        cvComplete: false,
        jobs: 2,
        matchChecked: true,
        coverLetterWritten: false,
        interviewSessions: 0,
      }),
      [
        { key: "cv_created", done: true },
        { key: "cv_complete", done: false },
        { key: "job_tracked", done: true },
        { key: "match_checked", done: true },
        { key: "cover_letter", done: false },
        { key: "mock_interview", done: false },
      ],
    );
  });
});
