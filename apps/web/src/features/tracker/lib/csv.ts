import type { Job } from "@careerportal/shared/types";
import { statusLabel } from "../constants";
import { appliedDateKey, toDateKey } from "./follow-up";

/*
 * CSV export of the loaded applications, built in the browser. Every cell is
 * quoted, and text starting with a formula trigger (= + - @, tab, CR) gets a
 * leading apostrophe so spreadsheet apps show it instead of evaluating it
 * (CSV/formula injection).
 */

const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  let text = String(value);
  if (typeof value === "string" && FORMULA_TRIGGER.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

const HEADERS = [
  "Company",
  "Job title",
  "Stage",
  "Location",
  "Salary",
  "Applied on",
  "Follow-up",
  "Job link",
  "CV version",
  "Cover letter",
  "Key skills",
  "CV match %",
  "Notes",
  "Added",
  "Updated",
];

interface CsvTitles {
  cv: ReadonlyMap<string, string>;
  letters: ReadonlyMap<string, string>;
  /** Letters that link a job from the letter side: job id → title. */
  lettersByJob?: ReadonlyMap<string, string>;
}

/** UTF-8 BOM + CRLF rows, which Excel, Numbers and Google Sheets all open correctly. */
export function buildJobsCsv(jobs: readonly Job[], titles: CsvTitles): string {
  const rows = jobs.map((job) => [
    job.company,
    job.role,
    statusLabel(job.status),
    job.location,
    job.salary,
    appliedDateKey(job.appliedAt),
    toDateKey(job.followUpDate),
    job.url,
    job.cvVersionId ? titles.cv.get(job.cvVersionId) ?? job.cvVersion?.title ?? "" : "",
    job.coverLetterId
      ? titles.letters.get(job.coverLetterId) ?? job.linkedCoverLetter?.title ?? ""
      : titles.lettersByJob?.get(job.id) ?? "",
    (job.keySkills ?? []).join(", "),
    job.matchScore ?? null,
    job.notes,
    toDateKey(job.createdAt),
    toDateKey(job.updatedAt),
  ]);
  const lines = [HEADERS, ...rows].map((row) => row.map(csvCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function jobsCsvFilename(today: string): string {
  return `job-applications-${today}.csv`;
}
