import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { Job } from "@careerportal/shared/types";
import {
  EMPTY_JOB_FORM,
  buildCreateRequest,
  buildJobPatch,
  isValidWebUrl,
  normalizeWebUrl,
  parseSkills,
  rebaseFormValues,
  safeExternalUrl,
  sameFormValues,
  toFormValues,
  validateJobForm,
  type JobFormValues,
} from "./job-form";

const job: Job = {
  id: "job-1",
  userId: "user-1",
  company: "Acme",
  role: "Engineer",
  status: "applied",
  url: "https://acme.com/jobs/1",
  notes: "Met at a meetup",
  cvVersionId: "cv-1",
  coverLetterId: "cl-1",
  followUpDate: "2026-10-20T00:00:00.000Z",
  jobDescription: null,
  hasJobDescription: true,
  location: "London",
  salary: "£60k",
  appliedAt: "2026-10-01T09:30:00.000Z",
  keySkills: ["React", "TypeScript"],
  matchScore: 72,
  matchCheckedAt: null,
  createdAt: "2026-10-01T09:30:00.000Z",
  updatedAt: "2026-10-02T09:30:00.000Z",
};

const form = (overrides: Partial<JobFormValues> = {}): JobFormValues => ({
  ...EMPTY_JOB_FORM,
  company: "Acme",
  role: "Engineer",
  ...overrides,
});

describe("URLs", () => {
  test("normalizeWebUrl adds https:// when the scheme is missing", () => {
    assert.equal(normalizeWebUrl("  acme.com/jobs/1 "), "https://acme.com/jobs/1");
    assert.equal(normalizeWebUrl("http://acme.com"), "http://acme.com");
    assert.equal(normalizeWebUrl("   "), "");
  });

  test("isValidWebUrl accepts public http(s) links only", () => {
    assert.equal(isValidWebUrl("https://acme.com/jobs/1"), true);
    assert.equal(isValidWebUrl("http://jobs.acme.co.uk"), true);
    assert.equal(isValidWebUrl("https://localhost:3000"), false);
    assert.equal(isValidWebUrl("https://user:pass@acme.com"), false);
    assert.equal(isValidWebUrl("javascript:alert(1)"), false);
    assert.equal(isValidWebUrl("ftp://acme.com"), false);
    assert.equal(isValidWebUrl("https://"), false);
  });

  test("safeExternalUrl never returns a script URL", () => {
    assert.equal(safeExternalUrl("javascript:alert(1)"), null);
    assert.equal(safeExternalUrl("data:text/html,hi"), null);
    assert.equal(safeExternalUrl("not a url"), null);
    assert.equal(safeExternalUrl(null), null);
    assert.equal(safeExternalUrl("https://acme.com/a b"), "https://acme.com/a%20b");
  });
});

describe("parseSkills", () => {
  test("splits, trims and de-duplicates case-insensitively", () => {
    assert.deepEqual(parseSkills("React, typescript ,\nreact,  Node   JS ,,"), ["React", "typescript", "Node JS"]);
    assert.deepEqual(parseSkills(""), []);
  });
});

describe("validateJobForm", () => {
  test("requires company and role", () => {
    const errors = validateJobForm(form({ company: "  ", role: "" }));
    assert.ok(errors.company);
    assert.ok(errors.role);
  });

  test("accepts a minimal valid form", () => {
    assert.deepEqual(validateJobForm(form()), {});
  });

  test("checks lengths, links, dates and skills", () => {
    const errors = validateJobForm(
      form({
        company: "x".repeat(201),
        url: "localhost:3000",
        location: "x".repeat(121),
        appliedAt: "15/10/2026",
        keySkills: Array.from({ length: 31 }, (_, i) => `skill${i}`).join(","),
      }),
    );
    assert.ok(errors.company);
    assert.ok(errors.url);
    assert.ok(errors.location);
    assert.ok(errors.appliedAt);
    assert.ok(errors.keySkills);
    assert.ok(validateJobForm(form({ keySkills: "x".repeat(61) })).keySkills);
  });
});

describe("buildCreateRequest", () => {
  test("trims values and leaves out empty optional fields", () => {
    assert.deepEqual(buildCreateRequest(form({ company: " Acme ", role: " Dev ", status: "applied" })), {
      company: "Acme",
      role: "Dev",
      status: "applied",
    });
  });

  test("includes filled optional fields", () => {
    const request = buildCreateRequest(
      form({
        url: "acme.com/jobs/1",
        followUpDate: "2026-10-22",
        jobDescription: "  We are hiring  ",
        keySkills: "React, React, Go",
      }),
    );
    assert.equal(request.url, "https://acme.com/jobs/1");
    assert.equal(request.followUpDate, "2026-10-22");
    assert.equal(request.jobDescription, "We are hiring");
    assert.deepEqual(request.keySkills, ["React", "Go"]);
  });
});

describe("buildJobPatch", () => {
  const initial = toFormValues(job);

  test("toFormValues reads calendar dates and joins skills", () => {
    assert.equal(initial.followUpDate, "2026-10-20");
    assert.equal(initial.appliedAt, "2026-10-01");
    assert.equal(initial.keySkills, "React, TypeScript");
  });

  test("an untouched form produces an empty patch (stale linked ids are not resent)", () => {
    assert.deepEqual(buildJobPatch(initial, { ...initial }), {});
    assert.deepEqual(buildJobPatch(initial, { ...initial, notes: `${initial.notes}  ` }), {});
  });

  test("cleared nullable fields are sent as null", () => {
    const patch = buildJobPatch(initial, {
      ...initial,
      url: "",
      notes: " ",
      cvVersionId: "",
      coverLetterId: "",
      followUpDate: "",
      location: "",
    });
    assert.deepEqual(patch, {
      url: null,
      notes: null,
      cvVersionId: null,
      coverLetterId: null,
      followUpDate: null,
      location: null,
    });
  });

  test("only changed fields are sent, trimmed and normalised", () => {
    const patch = buildJobPatch(initial, {
      ...initial,
      company: " Acme Ltd ",
      status: "onsite",
      url: "acme.com/jobs/2",
      keySkills: "React, TypeScript, GraphQL",
    });
    assert.deepEqual(patch, {
      company: "Acme Ltd",
      status: "onsite",
      url: "https://acme.com/jobs/2",
      keySkills: ["React", "TypeScript", "GraphQL"],
    });
  });

  test("an equivalent URL without the scheme is not a change", () => {
    const initialNoScheme = { ...initial, url: "acme.com/jobs/1" };
    assert.deepEqual(buildJobPatch(initialNoScheme, { ...initialNoScheme, url: "https://acme.com/jobs/1" }), {});
  });
});

describe("rebaseFormValues", () => {
  const base = toFormValues(job);

  test("untouched fields take the newer server value; edits are kept", () => {
    const edited = { ...base, notes: "Call back Tuesday" };
    const next = { ...base, cvVersionId: "cv-tailored", coverLetterId: "cl-tailored", notes: "Server notes" };
    const rebased = rebaseFormValues(edited, base, next);
    assert.equal(rebased.cvVersionId, "cv-tailored");
    assert.equal(rebased.coverLetterId, "cl-tailored");
    assert.equal(rebased.notes, "Call back Tuesday");
    assert.deepEqual(buildJobPatch(next, rebased), { notes: "Call back Tuesday" });
  });

  test("sameFormValues compares every field", () => {
    assert.equal(sameFormValues(base, { ...base }), true);
    assert.equal(sameFormValues(base, { ...base, followUpDate: "" }), false);
  });
});
