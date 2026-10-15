/*
 * Client-side copies of the API's email and URL rules (class-validator's
 * IsEmail / IsUrl, i.e. validator.js isEmail / isURL / isFQDN with default
 * options), so a value the form accepts is never a 400 on save. Where they
 * differ, these are stricter (IP-address hosts and quoted local parts are
 * refused), never looser.
 */

const TLD = /^([a-z¡-¨ª-퟿豈-﷏ﷰ-￯]{2,}|xn[a-z0-9-]{2,})$/i;
/** Letters, digits and hyphens (plus non-ASCII); no underscores. */
const LABEL = /^[a-z¡-￿0-9-]+$/i;
const FULL_WIDTH = /[！-～]/;

/** validator.js isFQDN defaults: a TLD is required, no underscores, no numeric TLD. */
export function isFqdn(host: string): boolean {
  const labels = host.split(".");
  if (labels.length < 2) return false;
  if (!TLD.test(labels[labels.length - 1])) return false;
  return labels.every(
    (label) =>
      label.length > 0 &&
      label.length <= 63 &&
      LABEL.test(label) &&
      !FULL_WIDTH.test(label) &&
      !label.startsWith("-") &&
      !label.endsWith("-"),
  );
}

const byteLength = (value: string) => new TextEncoder().encode(value).length;

/** Unquoted local-part characters validator.js allows (utf8 local parts on). */
const LOCAL_PART = /^[a-z\d!#$%&'*+\-/=?^_`{|}~¡-퟿豈-﷏ﷰ-￯]+$/i;

/** validator.js isEmail defaults (without quoted local parts or IP domains). */
export function isEmailAddress(value: string): boolean {
  if (value.length > 254) return false;
  const at = value.lastIndexOf("@");
  if (at <= 0) return false;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (byteLength(local) > 64 || byteLength(domain) > 254) return false;
  if (!isFqdn(domain)) return false;
  // Every dot-separated part must be non-empty: no leading, trailing or double dots.
  return local.split(".").every((part) => LOCAL_PART.test(part));
}

export interface WebUrlOptions {
  /** Refuse "user:pass@" in the URL (the tracker's job links do). */
  disallowAuth?: boolean;
}

/**
 * validator.js isURL with `protocols: ["http", "https"], require_protocol: true`,
 * applied to the text as typed (as the API sees it): http(s) only, a fully
 * qualified host name, a valid port, no spaces or angle brackets, at most
 * 2084 characters.
 */
export function isWebUrl(value: string, options: WebUrlOptions = {}): boolean {
  if (!value || value.length > 2084 || /[\s<>]/.test(value)) return false;
  const scheme = /^https?:\/\//i.exec(value);
  if (!scheme) return false;
  try {
    new URL(value);
  } catch {
    return false;
  }

  const authority = value.slice(scheme[0].length).split(/[/?#]/, 1)[0] ?? "";
  const parts = authority.split("@");
  if (parts.length > 1) {
    if (options.disallowAuth) return false;
    const credentials = (parts.shift() ?? "").split(":");
    if (credentials.length > 2) return false;
    if (credentials[0] === "" && (credentials.length === 1 || credentials[1] === "")) return false;
  }
  const hostAndPort = parts.join("@");
  // IP-address hosts (which the API would accept) are refused: links on a CV
  // or a job ad use domain names.
  if (hostAndPort.startsWith("[")) return false;
  const [host = "", ...portParts] = hostAndPort.split(":");
  const port = portParts.join(":");
  if (port && (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)) return false;
  return isFqdn(host);
}
