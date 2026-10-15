import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { DashboardSummary, JobBrief } from "@careerportal/shared/types";
import { activityHref, normalizeSummary, onboardingProgress, splitFollowUps, timeAgo } from "./summary";

function brief(id: string, followUpDate: string | null, status: JobBrief["status"] = "applied"): JobBrief {
  return { id, company: id, role: "Dev", status, followUpDate, appliedAt: null, updatedAt: "2026-10-01T00:00:00.000Z" };
}

describe("splitFollowUps", () => {
  test("splits by the local calendar date and skips closed or undated jobs", () => {
    const groups = splitFollowUps(
      [
        brief("a", "2026-10-10T00:00:00.000Z"),
        brief("b", "2026-10-15T00:00:00.000Z"),
        brief("c", "2026-10-15"),
        brief("d", "2026-10-20T00:00:00.000Z"),
        brief("e", "2026-10-01T00:00:00.000Z", "rejected"),
        brief("f", null),
      ],
      "2026-10-15",
    );
    assert.deepEqual(groups.overdue.map((j) => j.id), ["a"]);
    assert.deepEqual(groups.today.map((j) => j.id), ["b", "c"]);
    assert.deepEqual(groups.upcoming.map((j) => j.id), ["d"]);
  });
});

describe("activityHref", () => {
  test("links every activity type to its item", () => {
    assert.equal(activityHref({ type: "cv", id: "1" }), "/app/cv?version=1");
    assert.equal(activityHref({ type: "cover-letter", id: "2" }), "/app/cover-letters?letter=2");
    assert.equal(activityHref({ type: "job", id: "3" }), "/app/jobs?job=3");
    assert.equal(activityHref({ type: "interview", id: "4" }), "/app/practice?session=4");
    assert.equal(activityHref({ type: "technical-test", id: "5" }), "/app/technical-tests?test=5");
    assert.equal(activityHref({ type: "job", id: "a&b" }), "/app/jobs?job=a%26b");
  });

  test("unknown types have no link", () => {
    assert.equal(activityHref({ type: "unknown" as never, id: "1" }), null);
  });
});

describe("timeAgo", () => {
  const now = Date.parse("2026-10-15T12:00:00.000Z");
  test("uses short relative times", () => {
    assert.equal(timeAgo("2026-10-15T11:59:40.000Z", now), "just now");
    assert.equal(timeAgo("2026-10-15T11:55:00.000Z", now), "5m ago");
    assert.equal(timeAgo("2026-10-15T09:00:00.000Z", now), "3h ago");
    assert.equal(timeAgo("2026-10-13T12:00:00.000Z", now), "2d ago");
    assert.equal(timeAgo("2026-10-16T12:00:00.000Z", now), "just now");
    assert.equal(timeAgo("not a date", now), "");
  });
});

describe("onboardingProgress", () => {
  test("counts known steps and finds the next one", () => {
    const progress = onboardingProgress([
      { key: "cv_created", done: true },
      { key: "cv_complete", done: false },
      { key: "job_tracked", done: true },
      { key: "something_new" as never, done: false },
    ]);
    assert.equal(progress.total, 3);
    assert.equal(progress.done, 2);
    assert.equal(progress.next, "cv_complete");
    assert.equal(progress.steps[0].href, "/app/cv?new=1");
  });

  test("all done has no next step", () => {
    assert.equal(onboardingProgress([{ key: "cv_created", done: true }]).next, null);
  });
});

describe("normalizeSummary", () => {
  test("fills sections an older API omits", () => {
    const partial = {
      counts: { cvVersions: 1, coverLetters: 0, jobs: 0, interviewSessions: 0, technicalTests: 0 },
      recentActivity: [],
    } as unknown as DashboardSummary;
    const summary = normalizeSummary(partial);
    assert.deepEqual(summary.actionCentre, { followUps: [], staleApplications: [], interviewing: [] });
    assert.deepEqual(summary.onboarding, { dismissed: true, steps: [] });
    assert.deepEqual(summary.pipeline, {});
  });
});
