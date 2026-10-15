import { AI_INPUT_LIMITS } from "../ai.constants";
import { clampText, singleLine } from "../ai-json";
import type { AiContextSection } from "../ai.types";

/** CV `SectionType` values (mirrors libs/shared/types cv.ts). */
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

export type SectionTypeName = (typeof SECTION_TYPES)[number];

/** Known section type, or "custom". */
export function toSectionType(raw: unknown): SectionTypeName {
  const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return (SECTION_TYPES as readonly string[]).includes(value)
    ? (value as SectionTypeName)
    : "custom";
}

/** Markdown and style rules shared by every CV-writing prompt. */
export const CV_WRITING_RULES = `Write as the candidate, in implied first person (no "I", never third person). Direct, technical, no fluff.
Markdown only: **bold** for emphasis, "### Company | Role | Dates" for entries, "- " for bullets, [text](url) for links. Only ### headings (never # or ##). No code blocks, tables or HTML. Do not repeat the section title.
Prefer strong verbs (Built, Shipped, Architected, Migrated, Optimised, Scaled, Deployed, Owned) and cut filler ("responsible for" → "Owned").`;

/** Anti-fabrication rules shared by every CV and cover-letter prompt. */
export const ACCURACY_RULES = `Accuracy rules (critical):
- Keep every employer, job title, date, qualification, skill and achievement the candidate wrote. Never drop any.
- Never invent employers, job titles, dates, degrees, certifications, metrics, achievements or skills. Use numbers only when the candidate gave them.
- You may emphasise skills from the job description only where the candidate's own text shows them.`;

const CONTEXT_PRIORITY: Readonly<Record<string, number>> = {
  profile: 0,
  experience: 1,
  skills: 2,
  projects: 3,
  education: 4,
  certifications: 5,
};

export interface CvContextLimits {
  maxSections: number;
  perSectionChars: number;
  totalChars: number;
}

const DEFAULT_CONTEXT_LIMITS: CvContextLimits = {
  maxSections: AI_INPUT_LIMITS.contextSections,
  perSectionChars: AI_INPUT_LIMITS.contextSectionChars,
  totalChars: AI_INPUT_LIMITS.contextTotalChars,
};

/** Smallest remainder worth including once the total budget is nearly spent. */
const MIN_CONTEXT_REMAINDER = 200;

/**
 * Other CV sections as prompt context: most useful types first, then bounded
 * by section count, per-section size and total size (cut parts are marked).
 */
export function buildCvContext(
  sections: readonly AiContextSection[] | undefined,
  limits: CvContextLimits = DEFAULT_CONTEXT_LIMITS,
): string {
  if (!sections?.length) return "";
  const ordered = sections
    .map((section, index) => ({ section, index }))
    .filter(({ section }) => section.content?.trim())
    .sort(
      (a, b) =>
        (CONTEXT_PRIORITY[toSectionType(a.section.sectionType)] ?? 9) -
          (CONTEXT_PRIORITY[toSectionType(b.section.sectionType)] ?? 9) ||
        a.index - b.index,
    )
    .slice(0, limits.maxSections);

  const parts: string[] = [];
  let remaining = limits.totalChars;
  for (const { section } of ordered) {
    if (remaining < MIN_CONTEXT_REMAINDER) break;
    const body = clampText(
      section.content,
      Math.min(limits.perSectionChars, remaining),
    ).text;
    remaining -= body.length;
    parts.push(`[${singleLine(section.title, 100) || "Section"}]\n${body}`);
  }
  return parts.join("\n\n");
}

/** "https://" prefixed when the scheme is missing; "" when not a plausible http(s) URL. */
export function normaliseUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value)
    ? value
    : `https://${value}`;
  try {
    const url = new URL(withScheme);
    const httpLike = url.protocol === "https:" || url.protocol === "http:";
    return httpLike && url.hostname.includes(".") ? withScheme : "";
  } catch {
    return "";
  }
}

/** The address when it looks like an email, else "". */
export function normaliseEmail(raw: string): string {
  const value = raw.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : "";
}
