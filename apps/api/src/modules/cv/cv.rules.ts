/*
 * CV content rules shared by the DTOs, CvService and the PDF renderer.
 * Mirrors CV_LIMITS / SectionType in libs/shared/types/src/cv.ts
 * (cv.rules.spec.ts asserts they match).
 */

export const CV_LIMITS = {
  maxSectionsPerVersion: 30,
  sectionTitle: 200,
  sectionContent: 15_000,
  versionTitle: 120,
} as const;

/** Contact field lengths (DTO limits). */
export const CV_CONTACT_LIMITS = {
  name: 200,
  email: 200,
  phone: 50,
  location: 200,
  url: 500,
  photoUrl: 2048,
} as const;

export const SECTION_TYPES = [
  "profile",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "interests",
  "custom",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

/**
 * Known section type (trimmed, lowercase), or "custom". Legacy rows may hold
 * other values, so unknown types are coerced rather than rejected.
 */
export function toSectionType(raw: unknown): SectionType {
  const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return (SECTION_TYPES as readonly string[]).includes(value)
    ? (value as SectionType)
    : "custom";
}

export type ContactUrlKind = "website" | "linkedin" | "github";

const PROFILE_URL_PREFIX: Record<Exclude<ContactUrlKind, "website">, string> = {
  linkedin: "https://linkedin.com/in/",
  github: "https://github.com/",
};

/** A bare profile handle such as `jane-doe` or `@jane` (no dots or slashes). */
const HANDLE = /^@?([A-Za-z0-9_-]{1,100})$/;

/**
 * Normalise a contact URL the way users type it: `linkedin.com/in/jane`
 * → `https://linkedin.com/in/jane`; a bare LinkedIn/GitHub handle → the
 * profile URL; values with an http(s) scheme are kept. Returns "" for blank
 * input. The result is still validated as a URL by the caller.
 */
export function normalizeContactUrl(kind: ContactUrlKind, raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (kind !== "website") {
    const handle = HANDLE.exec(value);
    if (handle) return `${PROFILE_URL_PREFIX[kind]}${handle[1]}`;
  }
  return `https://${value.replace(/^\/+/, "")}`;
}
