import { addDaysToDateKey } from "./follow-up";

/*
 * Builds a one-event iCalendar file (RFC 5545) in the browser for a follow-up
 * reminder: an all-day event on the follow-up date with a 9am alarm. Nothing
 * is sent to a server.
 */

export interface FollowUpEventInput {
  jobId: string;
  company: string;
  role: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** Absolute link back to the job in the tracker. */
  url?: string;
  now?: Date;
}

const CRLF = "\r\n";
/** RFC 5545 §3.1: lines longer than 75 octets are folded. */
const MAX_LINE_OCTETS = 75;

/** RFC 5545 §3.3.11 TEXT escaping; other control characters are dropped. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\\;,]/g, (ch) => `\\${ch}`)
    .replace(/\n/g, "\\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "");
}

function utf8Length(char: string): number {
  const code = char.codePointAt(0) ?? 0;
  if (code < 0x80) return 1;
  if (code < 0x800) return 2;
  if (code < 0x10000) return 3;
  return 4;
}

/** Folds a content line at 75 octets without splitting a UTF-8 character. */
export function foldIcsLine(line: string): string {
  const parts: string[] = [];
  let current = "";
  let octets = 0;
  for (const char of line) {
    const size = utf8Length(char);
    // Continuation lines start with a space, which counts towards the limit.
    const limit = parts.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;
    if (octets + size > limit) {
      parts.push(current);
      current = "";
      octets = 0;
    }
    current += char;
    octets += size;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

function toIcsDate(dateKey: string): string {
  return dateKey.replace(/-/g, "");
}

function toIcsTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildFollowUpIcs({ jobId, company, role, date, url, now = new Date() }: FollowUpEventInput): string {
  const title = `Follow up: ${role} at ${company}`;
  const description = [
    `Check in about your application for ${role} at ${company}.`,
    url ? `Open it in your job tracker: ${url}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//careerRepo//Job Tracker//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // Stable per job, so re-downloading updates the same event in most calendars.
    `UID:follow-up-${jobId.replace(/[^a-zA-Z0-9-]/g, "")}@career-repo.com`,
    `DTSTAMP:${toIcsTimestamp(now)}`,
    `DTSTART;VALUE=DATE:${toIcsDate(date)}`,
    `DTEND;VALUE=DATE:${toIcsDate(addDaysToDateKey(date, 1))}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    ...(url ? [`URL:${url.replace(/[\r\n]/g, "")}`] : []),
    "TRANSP:TRANSPARENT",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(title)}`,
    "TRIGGER;RELATED=START:PT9H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldIcsLine).join(CRLF) + CRLF;
}

/** "follow-up-acme-corp-2026-10-22.ics" */
export function followUpIcsFilename(company: string, date: string): string {
  const slug = company
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `follow-up-${slug || "job"}-${date}.ics`;
}
