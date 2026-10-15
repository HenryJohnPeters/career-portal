import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { Job } from "@careerportal/shared/types";
import { buildJobsCsv, csvCell, jobsCsvFilename } from "./csv";

describe("csvCell", () => {
  test("quotes every value and doubles embedded quotes", () => {
    assert.equal(csvCell('Say "hi", then leave'), '"Say ""hi"", then leave"');
    assert.equal(csvCell("line1\nline2"), '"line1\nline2"');
    assert.equal(csvCell(null), '""');
    assert.equal(csvCell(72), '"72"');
  });

  test("neutralises spreadsheet formulas", () => {
    assert.equal(csvCell("=HYPERLINK(\"http://evil\")"), '"\'=HYPERLINK(""http://evil"")"');
    assert.equal(csvCell("+1 234"), '"\'+1 234"');
    assert.equal(csvCell("-5"), '"\'-5"');
    assert.equal(csvCell("@SUM(A1)"), '"\'@SUM(A1)"');
    assert.equal(csvCell("\tcmd"), '"\'\tcmd"');
    assert.equal(csvCell("Acme"), '"Acme"');
  });
});

describe("buildJobsCsv", () => {
  const job: Job = {
    id: "job-1",
    userId: "user-1",
    company: "=Acme",
    role: "Engineer",
    status: "phone_screen",
    url: "https://acme.com/jobs/1",
    notes: 'Spoke to "Sam"',
    cvVersionId: "cv-1",
    coverLetterId: null,
    followUpDate: "2026-10-20T00:00:00.000Z",
    jobDescription: null,
    hasJobDescription: false,
    location: "Leeds",
    salary: null,
    appliedAt: "2026-10-01T10:00:00.000Z",
    keySkills: ["React", "Go"],
    matchScore: 64,
    matchCheckedAt: null,
    createdAt: "2026-09-30T10:00:00.000Z",
    updatedAt: "2026-10-02T10:00:00.000Z",
  };

  test("writes a BOM, a header row and one CRLF row per job", () => {
    const csv = buildJobsCsv([job], { cv: new Map([["cv-1", "Master CV"]]), letters: new Map() });
    assert.ok(csv.startsWith("﻿\"Company\""));
    const lines = csv.slice(1).trimEnd().split("\r\n");
    assert.equal(lines.length, 2);
    assert.equal(
      lines[1],
      [
        "\"'=Acme\"",
        '"Engineer"',
        '"Phone Screen"',
        '"Leeds"',
        '""',
        '"2026-10-01"',
        '"2026-10-20"',
        '"https://acme.com/jobs/1"',
        '"Master CV"',
        '""',
        '"React, Go"',
        '"64"',
        '"Spoke to ""Sam"""',
        '"2026-09-30"',
        '"2026-10-02"',
      ].join(","),
    );
  });

  test("a letter linked from the letter side fills the cover-letter column", () => {
    const csv = buildJobsCsv([job], {
      cv: new Map(),
      letters: new Map(),
      lettersByJob: new Map([["job-1", "Acme letter"]]),
    });
    assert.ok(csv.includes('"Acme letter"'));
  });

  test("names the file by date", () => {
    assert.equal(jobsCsvFilename("2026-10-15"), "job-applications-2026-10-15.csv");
  });
});
