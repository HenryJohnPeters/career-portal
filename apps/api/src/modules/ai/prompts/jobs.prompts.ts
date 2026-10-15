import { z } from "zod";
import { AI_INPUT_LIMITS } from "../ai.constants";
import {
  DATA_BLOCK_RULE,
  clampText,
  cleanStringList,
  dataBlock,
  rewriteTokenBudget,
  singleLine,
} from "../ai-json";
import type {
  JobDescriptionAnalysis,
  JobSeniority,
  TailorApplicationInput,
  TailorTone,
} from "../ai.types";
import {
  ACCURACY_RULES,
  CV_WRITING_RULES,
  buildCvContext,
  toSectionType,
  type SectionTypeName,
} from "./shared";
import type { BuiltPrompt } from "./cv.prompts";

/* ── Job description analyser ─────────────────────────────────────── */

const ANALYZE_SYSTEM = `You extract structured facts from a job advert. Use only what the advert states; use null for anything it does not state.
- company, role, location (include remote/hybrid), salary (as written): short strings or null.
- seniority: one of "junior", "mid", "senior", "lead", or null when unclear.
- keySkills: up to 15 required skills and technologies, short names (e.g. "TypeScript", "AWS").
- niceToHave: up to 10 optional or "bonus" skills.
- summary: 2-3 plain sentences (max 400 characters) describing the role.
${DATA_BLOCK_RULE}
Respond with a JSON object: {"company": null, "role": null, "location": null, "salary": null, "seniority": null, "keySkills": [], "niceToHave": [], "summary": ""}.`;

const SENIORITY_ALIASES: ReadonlyMap<string, JobSeniority> = new Map<
  string,
  JobSeniority
>([
  ["junior", "junior"],
  ["entry", "junior"],
  ["entry-level", "junior"],
  ["graduate", "junior"],
  ["intern", "junior"],
  ["mid", "mid"],
  ["mid-level", "mid"],
  ["intermediate", "mid"],
  ["senior", "senior"],
  ["lead", "lead"],
  ["staff", "lead"],
  ["principal", "lead"],
]);

const optionalText = (max: number) =>
  z
    .unknown()
    .transform((value) =>
      typeof value === "string" ? singleLine(value, max) || null : null,
    );

export const jobAnalysisSchema = z
  .object({
    company: optionalText(120),
    role: optionalText(120),
    location: optionalText(120),
    salary: optionalText(120),
    seniority: z.unknown(),
    keySkills: z.unknown(),
    niceToHave: z.unknown(),
    summary: z.unknown(),
  })
  .transform(
    (raw): JobDescriptionAnalysis => ({
      company: raw.company,
      role: raw.role,
      location: raw.location,
      salary: raw.salary,
      seniority:
        typeof raw.seniority === "string"
          ? SENIORITY_ALIASES.get(raw.seniority.trim().toLowerCase()) ?? null
          : null,
      keySkills: cleanStringList(raw.keySkills, 20, 60),
      niceToHave: cleanStringList(raw.niceToHave, 15, 60),
      summary:
        typeof raw.summary === "string" ? raw.summary.trim().slice(0, 600) : "",
    }),
  );

export function buildAnalyzeJobPrompt(jobDescription: string): BuiltPrompt {
  const text = clampText(jobDescription, AI_INPUT_LIMITS.jobDescriptionAnalysis);
  return {
    system: ANALYZE_SYSTEM,
    user: `Extract the facts from this job advert.\n\n${dataBlock("job_description", text.text)}`,
    maxTokens: 900,
    truncated: text.truncated,
  };
}

/* ── Tailor kit: CV sections ──────────────────────────────────────── */

/** "the X role at Y", degrading gracefully when either is missing. */
function targetRole(input: Pick<TailorApplicationInput, "role" | "company">): string {
  const role = singleLine(input.role, AI_INPUT_LIMITS.shortText);
  const company = singleLine(input.company, AI_INPUT_LIMITS.shortText);
  if (role && company) return `the ${role} role at ${company}`;
  if (role) return `the ${role} role`;
  if (company) return `a role at ${company}`;
  return "the job in <job_description>";
}

/** Section types the tailor kit rewrites; the others are copied unchanged. */
export const TAILORABLE_SECTION_TYPES: readonly SectionTypeName[] = [
  "profile",
  "experience",
  "skills",
];

const TAILOR_SYSTEM = `You tailor a software developer's CV sections to one specific job.
You may reorder, rephrase, tighten and emphasise what each section already says so the most relevant experience comes first.
Hard rules:
- Never add employers, job titles, dates, degrees, certifications, metrics or skills that the section does not already contain.
- Keep every "### " entry heading exactly as written and keep every entry.
${CV_WRITING_RULES}
${ACCURACY_RULES}
${DATA_BLOCK_RULE}
Respond with a JSON object: {"sections": [{"key": "s1", "content": "<tailored Markdown>"}]}, one item for every <cv_section> key, using the same keys.`;

export interface TailorSectionsPrompt extends BuiltPrompt {
  /** Prompt key ("s1", "s2", …) → input section id, for the sections sent. */
  keyToId: ReadonlyMap<string, string>;
}

/** The tailorable sections that fit the size budget, in CV order. */
export function pickTailorableSections(
  sections: TailorApplicationInput["sections"],
  budget: number = AI_INPUT_LIMITS.tailorTotalChars,
): TailorApplicationInput["sections"] {
  const picked: TailorApplicationInput["sections"] = [];
  let used = 0;
  for (const section of sections) {
    const type = toSectionType(section.sectionType);
    const length = section.content.trim().length;
    if (!TAILORABLE_SECTION_TYPES.includes(type) || length === 0) continue;
    // A section is rewritten whole or not at all: cutting it would lose content.
    if (used + length > budget) continue;
    used += length;
    picked.push(section);
  }
  return picked;
}

export function buildTailorSectionsPrompt(
  input: TailorApplicationInput,
  sections: TailorApplicationInput["sections"],
): TailorSectionsPrompt {
  const keyToId = new Map<string, string>();
  const blocks = sections.map((section, index) => {
    const key = `s${index + 1}`;
    keyToId.set(key, section.id);
    return dataBlock("cv_section", section.content.trim(), {
      key,
      type: toSectionType(section.sectionType),
      title: singleLine(section.title, 100),
    });
  });
  const jobDescription = clampText(
    input.jobDescription,
    AI_INPUT_LIMITS.jobDescriptionContext,
  ).text;
  const totalChars = sections.reduce((sum, s) => sum + s.content.length, 0);

  return {
    system: TAILOR_SYSTEM,
    user: [
      `Tailor my CV sections for ${targetRole(input)}.`,
      dataBlock("job_description", jobDescription),
      ...blocks,
    ].join("\n\n"),
    maxTokens: rewriteTokenBudget(totalChars, 1_500, 10_000),
    truncated: false,
    keyToId,
  };
}

export const tailoredSectionsSchema = z
  .object({ sections: z.array(z.unknown()) })
  .transform(({ sections }) => {
    const byKey = new Map<string, string>();
    for (const item of sections) {
      if (!item || typeof item !== "object") continue;
      const { key, content } = item as { key?: unknown; content?: unknown };
      if (typeof key !== "string" || typeof content !== "string") continue;
      const text = content.trim();
      // Longer than a CV section may be: treat as missing (the original is kept).
      if (text.length > AI_INPUT_LIMITS.sectionContent) continue;
      if (text && !byKey.has(key)) byKey.set(key, text);
    }
    return byKey;
  })
  .refine((byKey) => byKey.size > 0);

const YEAR_PATTERN = /\b(?:19|20)\d{2}\b/g;
const ENTRY_HEADING_PATTERN = /^###[ \t]+(.+)$/gm;

/** "### Company | Role | Dates" headings, ignoring emphasis, dash style, spacing and case. */
function entryHeadings(text: string): string[] {
  return [...text.matchAll(ENTRY_HEADING_PATTERN)].map((match) =>
    match[1]
      .replace(/[*_`]/g, "")
      .replace(/[‐-―−]/g, "-")
      .replace(/\s*([|-])\s*/g, "$1")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase(),
  );
}

/**
 * Deterministic guard against fabrication in a tailored section: no years
 * that the original lacks, every "### " entry heading (employer, role,
 * dates) kept, no new entry headings except regrouped skill categories, and
 * no large loss of content. A section that fails keeps its original text.
 */
export function isFaithfulTailoring(
  original: string,
  tailored: string,
  sectionType?: string,
): boolean {
  const originalYears = new Set(original.match(YEAR_PATTERN) ?? []);
  if ((tailored.match(YEAR_PATTERN) ?? []).some((year) => !originalYears.has(year))) {
    return false;
  }
  const originalHeadings = entryHeadings(original);
  const tailoredHeadings = entryHeadings(tailored);
  if (tailoredHeadings.length < originalHeadings.length) return false;
  const tailoredSet = new Set(tailoredHeadings);
  if (originalHeadings.some((heading) => !tailoredSet.has(heading))) return false;
  if (toSectionType(sectionType) !== "skills") {
    const originalSet = new Set(originalHeadings);
    if (tailoredHeadings.some((heading) => !originalSet.has(heading))) return false;
  }
  const originalLength = original.trim().length;
  return originalLength < 200 || tailored.length >= originalLength * 0.4;
}

/* ── Tailor kit: cover letter ─────────────────────────────────────── */

const TAILOR_TONES: Record<TailorTone, string> = {
  professional: "Polished, professional tone.",
  enthusiastic: "Warm, enthusiastic tone that stays professional.",
  concise: "Concise and direct: short paragraphs, no filler.",
};

export function toTailorTone(tone: string | undefined): TailorTone {
  return tone === "enthusiastic" || tone === "concise" ? tone : "professional";
}

export function buildTailorLetterPrompt(input: TailorApplicationInput): BuiltPrompt {
  const jobDescription = clampText(
    input.jobDescription,
    AI_INPUT_LIMITS.jobDescriptionContext,
  ).text;
  const cv = buildCvContext(input.sections);
  const name = singleLine(input.userName, 120);

  return {
    system: `You are an expert cover-letter writer. ${TAILOR_TONES[toTailorTone(input.tone)]}
Structure: greeting, 2-3 short paragraphs, closing and sign-off. At most 400 words. Plain text with a blank line between paragraphs.
Connect the candidate's real experience in <cv> to the needs in <job_description>. Never invent employers, dates, qualifications, metrics or achievements, and never use placeholder brackets.
${DATA_BLOCK_RULE}
Respond with a JSON object: {"content": "<the full letter>"}.`,
    user: [
      `Write my cover letter for ${targetRole(input)}.`,
      name ? `Candidate name: ${name}` : "",
      dataBlock("job_description", jobDescription),
      dataBlock("cv", cv),
    ]
      .filter(Boolean)
      .join("\n\n"),
    maxTokens: 1_000,
    truncated: false,
  };
}
