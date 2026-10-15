import type { CreateJobRequest, Job, JobStatus, UpdateJobRequest } from "@careerportal/shared/types";
import { JOB_FORM_LIMITS } from "../constants";
import { toDateKey } from "./follow-up";

/** Every editable job field as form text ("" = empty). */
export interface JobFormValues {
  company: string;
  role: string;
  status: JobStatus;
  url: string;
  location: string;
  salary: string;
  /** "YYYY-MM-DD" or "" */
  appliedAt: string;
  /** "YYYY-MM-DD" or "" */
  followUpDate: string;
  cvVersionId: string;
  coverLetterId: string;
  notes: string;
  /** Comma- or newline-separated. */
  keySkills: string;
  jobDescription: string;
}

export type JobFormErrors = Partial<Record<keyof JobFormValues, string>>;

export const EMPTY_JOB_FORM: JobFormValues = {
  company: "",
  role: "",
  status: "wishlist",
  url: "",
  location: "",
  salary: "",
  appliedAt: "",
  followUpDate: "",
  cvVersionId: "",
  coverLetterId: "",
  notes: "",
  keySkills: "",
  jobDescription: "",
};

const FORM_KEYS = Object.keys(EMPTY_JOB_FORM) as (keyof JobFormValues)[];

export function sameFormValues(a: JobFormValues, b: JobFormValues): boolean {
  return FORM_KEYS.every((key) => a[key] === b[key]);
}

function setValue<K extends keyof JobFormValues>(target: JobFormValues, key: K, value: JobFormValues[K]) {
  target[key] = value;
}

/**
 * Brings an open form up to date with a newer copy of the job (`next`): fields
 * the user hasn't touched (still equal to `base`) take the new value, edits
 * are kept.
 */
export function rebaseFormValues(
  current: JobFormValues,
  base: JobFormValues,
  next: JobFormValues,
): JobFormValues {
  const result = { ...current };
  for (const key of FORM_KEYS) {
    if (current[key] === base[key]) setValue(result, key, next[key]);
  }
  return result;
}

export function toFormValues(job: Job): JobFormValues {
  return {
    company: job.company,
    role: job.role,
    status: job.status,
    url: job.url ?? "",
    location: job.location ?? "",
    salary: job.salary ?? "",
    appliedAt: toDateKey(job.appliedAt) ?? "",
    followUpDate: toDateKey(job.followUpDate) ?? "",
    cvVersionId: job.cvVersionId ?? "",
    coverLetterId: job.coverLetterId ?? "",
    notes: job.notes ?? "",
    keySkills: (job.keySkills ?? []).join(", "),
    jobDescription: job.jobDescription ?? "",
  };
}

/** Trimmed; adds https:// when the scheme is missing ("acme.com/jobs/1"), as the API does. */
export function normalizeWebUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** http(s) with a dotted host name and no credentials (mirrors the API's URL rule). */
export function isValidWebUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      !parsed.username &&
      !parsed.password &&
      /\.[a-z0-9-]{2,}$/i.test(parsed.hostname)
    );
  } catch {
    return false;
  }
}

/** A link that is safe to render as an <a href>: http(s) only. */
export function safeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

/** Splits on commas/new lines, trims, collapses spaces, drops blanks and case-insensitive duplicates. */
export function parseSkills(text: string): string[] {
  const seen = new Set<string>();
  const skills: string[] = [];
  for (const part of text.split(/[,\n]/)) {
    const skill = part.trim().replace(/\s+/g, " ");
    const key = skill.toLowerCase();
    if (!skill || seen.has(key)) continue;
    seen.add(key);
    skills.push(skill);
  }
  return skills;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function tooLong(value: string, max: number, label: string): string | undefined {
  return value.trim().length > max ? `${label} must be ${max.toLocaleString()} characters or fewer.` : undefined;
}

/** Client-side mirror of the API's validation, so mistakes are caught before a request. */
export function validateJobForm(values: JobFormValues): JobFormErrors {
  const errors: JobFormErrors = {};
  const company = values.company.trim();
  const role = values.role.trim();

  if (!company) errors.company = "Enter the company name.";
  else errors.company = tooLong(company, JOB_FORM_LIMITS.company, "Company");
  if (!role) errors.role = "Enter the job title.";
  else errors.role = tooLong(role, JOB_FORM_LIMITS.role, "Job title");

  const url = normalizeWebUrl(values.url);
  if (url) {
    if (url.length > JOB_FORM_LIMITS.url) errors.url = "That link is too long.";
    else if (!isValidWebUrl(url)) errors.url = "Enter a web address, like https://company.com/jobs/123.";
  }

  errors.location = tooLong(values.location, JOB_FORM_LIMITS.location, "Location");
  errors.salary = tooLong(values.salary, JOB_FORM_LIMITS.salary, "Salary");
  errors.notes = tooLong(values.notes, JOB_FORM_LIMITS.notes, "Notes");
  errors.jobDescription = tooLong(values.jobDescription, JOB_FORM_LIMITS.jobDescription, "The job description");

  for (const key of ["appliedAt", "followUpDate"] as const) {
    if (values[key] && !DATE_KEY.test(values[key])) errors[key] = "Pick a valid date.";
  }

  const skills = parseSkills(values.keySkills);
  if (skills.length > JOB_FORM_LIMITS.keySkills) {
    errors.keySkills = `Keep it to ${JOB_FORM_LIMITS.keySkills} skills or fewer.`;
  } else if (skills.some((skill) => skill.length > JOB_FORM_LIMITS.keySkillLength)) {
    errors.keySkills = `Each skill must be ${JOB_FORM_LIMITS.keySkillLength} characters or fewer.`;
  }

  for (const key of Object.keys(errors) as (keyof JobFormValues)[]) {
    if (!errors[key]) delete errors[key];
  }
  return errors;
}

export function hasErrors(errors: JobFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Nullable text fields: compared trimmed, sent as null when emptied. */
const NULLABLE_TEXT_FIELDS = [
  "location",
  "salary",
  "appliedAt",
  "followUpDate",
  "cvVersionId",
  "coverLetterId",
  "notes",
  "jobDescription",
] as const;

/** POST /jobs body: trimmed values; empty optional fields are left out. */
export function buildCreateRequest(values: JobFormValues): CreateJobRequest {
  const request: CreateJobRequest = {
    company: values.company.trim(),
    role: values.role.trim(),
    status: values.status,
  };
  const url = normalizeWebUrl(values.url);
  if (url) request.url = url;
  for (const key of NULLABLE_TEXT_FIELDS) {
    const value = values[key].trim();
    if (value) request[key] = value;
  }
  const skills = parseSkills(values.keySkills);
  if (skills.length > 0) request.keySkills = skills;
  return request;
}

/**
 * PATCH /jobs/:id body with only the fields that differ from `initial`;
 * emptied nullable fields are sent as null so the API clears them. An empty
 * object means nothing changed.
 */
export function buildJobPatch(initial: JobFormValues, values: JobFormValues): UpdateJobRequest {
  const patch: UpdateJobRequest = {};

  for (const key of ["company", "role"] as const) {
    const value = values[key].trim();
    if (value !== initial[key].trim()) patch[key] = value;
  }
  if (values.status !== initial.status) patch.status = values.status;

  const url = normalizeWebUrl(values.url);
  if (url !== normalizeWebUrl(initial.url)) patch.url = url || null;

  for (const key of NULLABLE_TEXT_FIELDS) {
    const value = values[key].trim();
    if (value !== initial[key].trim()) patch[key] = value || null;
  }

  const skills = parseSkills(values.keySkills);
  if (skills.join("\n") !== parseSkills(initial.keySkills).join("\n")) patch.keySkills = skills;

  return patch;
}
