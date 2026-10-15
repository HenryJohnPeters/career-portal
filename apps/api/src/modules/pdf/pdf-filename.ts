/*
 * Download filenames such as "Jane Doe - CV.pdf". The header carries an ASCII
 * `filename` fallback plus an RFC 5987 `filename*` with the full UTF-8 name.
 */

const MAX_NAME_CHARS = 80;

/** User text → safe filename part: no control or path/reserved characters. */
export function sanitizeFilenamePart(raw: string | null | undefined): string {
  const cleaned = (raw ?? "")
    // Lone surrogates would make encodeURIComponent throw.
    .replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, "")
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g, "")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "");
  return Array.from(cleaned).slice(0, MAX_NAME_CHARS).join("").trim();
}

/** "<name> - <label>.pdf", or "<label>.pdf" when the name is empty. */
export function pdfFilename(name: string | null | undefined, label: string): string {
  const base = sanitizeFilenamePart(name);
  return base ? `${base} - ${label}.pdf` : `${label}.pdf`;
}

function toAsciiFallback(filename: string): string {
  const ascii = filename
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/["\\%;]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  // A name that was entirely non-ASCII leaves just "- <label>.pdf".
  return ascii.replace(/^-\s*/, "");
}

function encodeRfc5987(value: string): string {
  return encodeURIComponent(value).replace(
    /['()*]/g,
    (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/** Content-Disposition value for a generated PDF. */
export function contentDisposition(
  type: "inline" | "attachment",
  filename: string,
): string {
  const fallback = toAsciiFallback(filename);
  return `${type}; filename="${fallback}"; filename*=UTF-8''${encodeRfc5987(filename)}`;
}
