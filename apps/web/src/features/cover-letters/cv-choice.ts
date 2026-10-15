/**
 * Which CV the cover-letter AI may read. "" = the active CV (default),
 * "none" = no CV data is sent to the AI, anything else = that version's id.
 */
export type CvChoice = string;

export const ACTIVE_CV: CvChoice = "";
export const NO_CV: CvChoice = "none";

/** Request fields for the AI routes (PLAN §2.6: `useCv: false` never sends CV data). */
export function cvChoiceToRequest(choice: CvChoice): { useCv: boolean; cvVersionId?: string } {
  if (choice === NO_CV) return { useCv: false };
  if (choice === ACTIVE_CV) return { useCv: true };
  return { useCv: true, cvVersionId: choice };
}
