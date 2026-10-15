/** A NUL or any surrogate code unit: the only cases that need work. */
const NEEDS_CLEANING = /[\u0000\uD800-\uDFFF]/;
const NUL = /\u0000/g;
/** A high surrogate not followed by a low one, or a low one not preceded by a high one. */
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

/**
 * Text Postgres can store: NUL bytes (rejected in text and jsonb) are
 * removed and lone UTF-16 surrogates (not valid UTF-8; Prisma rejects them)
 * become U+FFFD, as String.prototype.toWellFormed does. Such characters
 * arrive with text pasted from PDF/Word exports or a cut through an emoji.
 */
export function toStorableText(value: string): string {
  if (!NEEDS_CLEANING.test(value)) return value;
  return value.replace(NUL, "").replace(LONE_SURROGATE, "\uFFFD");
}
