import type { CvContactFields } from "@careerportal/shared/types";

/** Contact fields edited in the CV builder (photoUrl has no editor). */
export type ContactKey = Exclude<keyof CvContactFields, "photoUrl">;
export type ContactValues = Record<ContactKey, string>;

export const CONTACT_KEYS: readonly ContactKey[] = [
  "name",
  "email",
  "phone",
  "location",
  "website",
  "linkedin",
  "github",
];

export const URL_KEYS: ReadonlySet<ContactKey> = new Set(["website", "linkedin", "github"]);

/** Server limits (UpdateCvVersionDto). */
export const CONTACT_MAX_LENGTH: Record<ContactKey, number> = {
  name: 200,
  email: 200,
  phone: 50,
  location: 200,
  website: 500,
  linkedin: 500,
  github: 500,
};

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Profile URL for a bare handle, as the API's normalizeContactUrl does. */
const PROFILE_URL_PREFIX: Partial<Record<ContactKey, string>> = {
  linkedin: "https://linkedin.com/in/",
  github: "https://github.com/",
};
/** A bare profile handle such as `jane-doe` or `@jane` (no dots or slashes). */
const HANDLE = /^@?([A-Za-z0-9_-]{1,100})$/;

/**
 * "linkedin.com/in/jane" → "https://linkedin.com/in/jane"; a bare LinkedIn or
 * GitHub handle ("jane-doe") → the profile URL; "" stays "" (clears the field).
 */
export function normaliseUrl(value: string, key?: ContactKey): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const profilePrefix = key ? PROFILE_URL_PREFIX[key] : undefined;
  const handle = profilePrefix ? HANDLE.exec(trimmed) : null;
  if (profilePrefix && handle) return `${profilePrefix}${handle[1]}`;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Mirrors the API's IsUrl rule: http(s) with a dotted host and a real TLD. */
export function validateUrl(value: string, key?: ContactKey): string | null {
  const normalised = normaliseUrl(value, key);
  if (!normalised) return null;
  if (normalised.length > 500) return "Links can be at most 500 characters.";
  if (/\s/.test(normalised)) return "Links can't contain spaces.";
  let url: URL;
  try {
    url = new URL(normalised);
  } catch {
    return "Enter a valid link, e.g. linkedin.com/in/your-name.";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return "Links must start with http:// or https://.";
  }
  const labels = url.hostname.split(".");
  const tld = labels[labels.length - 1] ?? "";
  if (labels.length < 2 || labels.some((l) => !l) || !/^([a-z]{2,63}|xn--[a-z0-9-]+)$/i.test(tld)) {
    return "Enter a valid link, e.g. linkedin.com/in/your-name.";
  }
  return null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > CONTACT_MAX_LENGTH.email) return "Email addresses can be at most 200 characters.";
  return EMAIL.test(trimmed) ? null : "Enter a valid email address, e.g. jane@example.com.";
}

/** A message when the value would be rejected by the API; null when it can be saved. */
export function validateContactField(key: ContactKey, value: string): string | null {
  if (key === "email") return validateEmail(value);
  if (URL_KEYS.has(key)) return validateUrl(value, key);
  if (value.trim().length > CONTACT_MAX_LENGTH[key]) {
    return `Keep this under ${CONTACT_MAX_LENGTH[key]} characters.`;
  }
  return null;
}

/** The value to send: trimmed, URLs given a scheme. "" clears the field. */
export function toContactPatchValue(key: ContactKey, value: string): string {
  return URL_KEYS.has(key) ? normaliseUrl(value, key) : value.trim();
}
