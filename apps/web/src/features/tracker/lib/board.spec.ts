import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { Job } from "@careerportal/shared/types";
import { EMPTY_FILTERS, filterJobs, groupJobsByStatus, hasActiveFilters } from "./board";

let seq = 0;
function makeJob(overrides: Partial<Job> = {}): Job {
  seq += 1;
  return {
    id: `job-${seq}`,
    userId: "user-1",
    company: "Acme",
    role: "Engineer",
    status: "applied",
    url: null,
    notes: null,
    cvVersionId: null,
    coverLetterId: null,
    followUpDate: null,
    jobDescription: null,
    hasJobDescription: false,
    location: null,
    salary: null,
    appliedAt: null,
    keySkills: [],
    matchScore: null,
    matchCheckedAt: null,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

const today = "2026-10-15";

describe("filterJobs", () => {
  const jobs = [
    makeJob({ company: "Globex", role: "Backend Dev", keySkills: ["Go", "Kubernetes"] }),
    makeJob({ company: "Initech", role: "Frontend", location: "Leeds", cvVersionId: "cv-1" }),
    makeJob({ company: "Acme", status: "onsite", followUpDate: "2026-10-14", coverLetterId: "cl-1" }),
    makeJob({ company: "Umbrella", status: "rejected", followUpDate: "2026-10-01" }),
    makeJob({ company: "Hooli", followUpDate: "2026-10-30" }),
  ];

  test("returns the same array when no filter is active", () => {
    assert.equal(filterJobs(jobs, EMPTY_FILTERS, today), jobs);
    assert.equal(hasActiveFilters({ ...EMPTY_FILTERS, search: "   " }), false);
  });

  test("searches company, role, location and key skills case-insensitively", () => {
    const names = (search: string) =>
      filterJobs(jobs, { ...EMPTY_FILTERS, search }, today).map((j) => j.company);
    assert.deepEqual(names("glob"), ["Globex"]);
    assert.deepEqual(names("FRONTEND"), ["Initech"]);
    assert.deepEqual(names("leeds"), ["Initech"]);
    assert.deepEqual(names("kubern"), ["Globex"]);
  });

  test("follow-up due skips closed applications and later dates", () => {
    const due = filterJobs(jobs, { ...EMPTY_FILTERS, followUpDue: true }, today);
    assert.deepEqual(due.map((j) => j.company), ["Acme"]);
  });

  test("combines status and missing-document filters", () => {
    assert.deepEqual(
      filterJobs(jobs, { ...EMPTY_FILTERS, status: "onsite" }, today).map((j) => j.company),
      ["Acme"],
    );
    assert.deepEqual(
      filterJobs(jobs, { ...EMPTY_FILTERS, missingCv: true, missingCoverLetter: true }, today).map(
        (j) => j.company,
      ),
      ["Globex", "Umbrella", "Hooli"],
    );
  });
});

describe("groupJobsByStatus", () => {
  test("groups in one pass and keeps the order within a status", () => {
    const a = makeJob({ status: "applied" });
    const b = makeJob({ status: "onsite" });
    const c = makeJob({ status: "applied" });
    const grouped = groupJobsByStatus([a, b, c]);
    assert.deepEqual(grouped.get("applied"), [a, c]);
    assert.deepEqual(grouped.get("onsite"), [b]);
    assert.equal(grouped.get("wishlist"), undefined);
  });
});
