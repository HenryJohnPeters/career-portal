import {
  CV_LIMITS,
  type AiFullCvResult,
  type ApplyCvContentRequest,
  type ApplyCvContentSection,
  type CvContactFields,
  type SectionType,
} from "@careerportal/shared/types";
import { inferSectionType } from "@careerportal/shared/types/cv-templates";
import {
  CONTACT_KEYS,
  CONTACT_MAX_LENGTH,
  toContactPatchValue,
  validateContactField,
} from "./contact";

const SECTION_TYPES: ReadonlySet<string> = new Set<SectionType>([
  "profile",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "interests",
  "custom",
]);

export function coerceSectionType(value: unknown, title: string): SectionType {
  const normalised = typeof value === "string" ? value.trim().toLowerCase() : "";
  return SECTION_TYPES.has(normalised)
    ? (normalised as SectionType)
    : inferSectionType(title);
}

/** A type alias (not an interface) so it satisfies DraftAutosaver's string record. */
export type SectionFields = {
  title: string;
  content: string;
};

/** Why a section can't be saved, or null. */
export function validateSectionFields(fields: SectionFields): string | null {
  if (!fields.title.trim()) return "Give this section a title to save it.";
  if (fields.title.length > CV_LIMITS.sectionTitle) {
    return `Section titles can be at most ${CV_LIMITS.sectionTitle} characters.`;
  }
  if (fields.content.length > CV_LIMITS.sectionContent) {
    return `This section is too long (max ${CV_LIMITS.sectionContent.toLocaleString("en-GB")} characters). Split it into two sections.`;
  }
  return null;
}

/**
 * Turn an AI full-CV result into one PUT /cv/versions/:id/content body.
 * Contact fields the AI did not find (or got wrong) are left unchanged; text is
 * clamped to the API limits so a long AI answer can't fail the whole apply.
 * Returns null when there is nothing to apply.
 */
export function toApplyCvContent(result: AiFullCvResult): ApplyCvContentRequest | null {
  const sections: ApplyCvContentSection[] = [];
  for (const raw of result.sections ?? []) {
    if (!raw || typeof raw.content !== "string" || !raw.content.trim()) continue;
    const title =
      (typeof raw.title === "string" ? raw.title.trim() : "") || "Section";
    sections.push({
      title: title.slice(0, CV_LIMITS.sectionTitle),
      content: raw.content.trim().slice(0, CV_LIMITS.sectionContent),
      sectionType: coerceSectionType(raw.sectionType, title),
    });
    if (sections.length === CV_LIMITS.maxSectionsPerVersion) break;
  }
  if (sections.length === 0) return null;

  const contact: CvContactFields = {};
  for (const key of CONTACT_KEYS) {
    const value = (result as unknown as Record<string, unknown>)[key];
    if (typeof value !== "string" || !value.trim()) continue;
    const clamped = value.trim().slice(0, CONTACT_MAX_LENGTH[key]);
    if (validateContactField(key, clamped)) continue;
    contact[key] = toContactPatchValue(key, clamped);
  }

  return Object.keys(contact).length > 0 ? { contact, sections } : { sections };
}
