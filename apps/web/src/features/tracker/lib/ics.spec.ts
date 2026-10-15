import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildFollowUpIcs, escapeIcsText, foldIcsLine, followUpIcsFilename } from "./ics";

const octets = (text: string) => new TextEncoder().encode(text).length;

describe("escapeIcsText", () => {
  test("escapes backslashes, semicolons, commas and new lines (RFC 5545 TEXT)", () => {
    assert.equal(escapeIcsText("a\\b;c,d\ne"), "a\\\\b\\;c\\,d\\ne");
    assert.equal(escapeIcsText("line1\r\nline2\rline3"), "line1\\nline2\\nline3");
  });

  test("drops control characters that could break the file", () => {
    assert.equal(escapeIcsText("ok\u0000\u0007\u001b done"), "ok done");
  });

  test("cannot inject new properties", () => {
    const escaped = escapeIcsText("Acme\nEND:VEVENT\nBEGIN:VEVENT");
    assert.ok(!escaped.includes("\n"));
  });
});

describe("foldIcsLine", () => {
  test("leaves short lines alone", () => {
    assert.equal(foldIcsLine("SUMMARY:short"), "SUMMARY:short");
  });

  test("folds long lines at 75 octets with a leading space on continuations", () => {
    const line = `DESCRIPTION:${"x".repeat(200)}`;
    const parts = foldIcsLine(line).split("\r\n");
    assert.ok(parts.length > 1);
    assert.equal(octets(parts[0]), 75);
    for (const part of parts.slice(1)) {
      assert.ok(part.startsWith(" "));
      assert.ok(octets(part) <= 75);
    }
    assert.equal(parts.map((p, i) => (i === 0 ? p : p.slice(1))).join(""), line);
  });

  test("never splits a multi-byte character", () => {
    const line = `SUMMARY:${"é€😀".repeat(30)}`;
    const parts = foldIcsLine(line).split("\r\n");
    for (const part of parts) assert.ok(octets(part) <= 75);
    assert.equal(parts.map((p, i) => (i === 0 ? p : p.slice(1))).join(""), line);
  });
});

describe("buildFollowUpIcs", () => {
  const ics = buildFollowUpIcs({
    jobId: "3f2a6c1e-1111-4222-8333-944455556666",
    company: "Acme, Inc.",
    role: "Senior Engineer; Platform",
    date: "2026-12-31",
    url: "https://app.example.com/app/jobs?job=3f2a6c1e-1111-4222-8333-944455556666",
    now: new Date("2026-10-15T08:30:00.000Z"),
  });
  const lines = ics.split("\r\n");

  test("is an all-day event on the follow-up date", () => {
    assert.ok(lines.includes("DTSTART;VALUE=DATE:20261231"));
    assert.ok(lines.includes("DTEND;VALUE=DATE:20270101"));
    assert.ok(lines.includes("DTSTAMP:20261015T083000Z"));
    assert.ok(lines.includes("UID:follow-up-3f2a6c1e-1111-4222-8333-944455556666@career-repo.com"));
  });

  test("escapes the title and uses CRLF line endings with folded lines", () => {
    assert.ok(ics.includes("SUMMARY:Follow up: Senior Engineer\\; Platform at Acme\\, Inc."));
    assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
    assert.ok(!/[^\r]\n/.test(ics));
    for (const line of lines) assert.ok(octets(line) <= 75, line);
  });

  test("wraps the event in a calendar", () => {
    assert.equal(lines[0], "BEGIN:VCALENDAR");
    assert.ok(lines.includes("BEGIN:VEVENT"));
    assert.ok(lines.includes("END:VEVENT"));
  });
});

describe("followUpIcsFilename", () => {
  test("slugs the company name", () => {
    assert.equal(followUpIcsFilename("Acme, Inc.", "2026-10-22"), "follow-up-acme-inc-2026-10-22.ics");
    assert.equal(followUpIcsFilename("Café Zürich", "2026-10-22"), "follow-up-cafe-zurich-2026-10-22.ics");
    assert.equal(followUpIcsFilename("!!!", "2026-10-22"), "follow-up-job-2026-10-22.ics");
  });
});
