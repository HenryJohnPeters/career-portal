/** Cover-letter text limits (UpdateCoverLetterDto) and validation. */
export const LETTER_TITLE_MAX = 200;
export const LETTER_BODY_MAX = 15_000;

/** A type alias so it satisfies DraftAutosaver's string record. */
export type LetterFields = { title: string; body: string };

export function validateLetterFields(fields: LetterFields): string | null {
  if (!fields.title.trim()) return "Give this letter a title to save it.";
  if (fields.title.length > LETTER_TITLE_MAX) {
    return `Titles can be at most ${LETTER_TITLE_MAX} characters.`;
  }
  if (fields.body.length > LETTER_BODY_MAX) {
    return `Letters can be at most ${LETTER_BODY_MAX.toLocaleString("en-GB")} characters.`;
  }
  return null;
}
