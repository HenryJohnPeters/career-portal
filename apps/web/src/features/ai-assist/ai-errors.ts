import { getErrorMessage, requestUpgradeForError } from "@careerportal/web/data-access";

/**
 * For AI calls made with `{ silent: true }`: quota and premium errors open the
 * global upgrade dialog (returns null — nothing to show inline); anything else
 * becomes a message for the panel's inline error.
 */
export function aiErrorMessage(
  err: unknown,
  fallback = "The AI request failed. Please try again.",
): string | null {
  if (requestUpgradeForError(err)) return null;
  return getErrorMessage(err, fallback);
}

export const EMPTY_AI_RESULT =
  "The AI returned an empty result. Please try again, or add more detail.";
