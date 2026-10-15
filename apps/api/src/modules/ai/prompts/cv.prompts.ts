import { z } from "zod";
import { AI_INPUT_LIMITS } from "../ai.constants";
import {
  DATA_BLOCK_RULE,
  clampText,
  dataBlock,
  rewriteTokenBudget,
  singleLine,
} from "../ai-json";
import type {
  AiCvSectionRequest,
  AiFullCvFromTextRequest,
  AiFullCvResult,
  AiFullCvSection,
} from "../ai.types";
import {
  ACCURACY_RULES,
  CV_WRITING_RULES,
  buildCvContext,
  normaliseEmail,
  normaliseUrl,
  toSectionType,
} from "./shared";

export interface BuiltPrompt {
  system: string;
  user: string;
  maxTokens: number;
  /** The text the AI rewrites was cut to fit the AI limit. */
  truncated: boolean;
}

/* ── One CV section ───────────────────────────────────────────────── */

const SECTION_SYSTEM = `You help a software developer write one section of their CV.
${CV_WRITING_RULES}
Length: profile 3-5 lines; experience 3-5 bullets per role; skills as grouped lists.
${ACCURACY_RULES}
${DATA_BLOCK_RULE}
Respond with a JSON object: {"content": "<the section content as Markdown>"}.`;

/** Output must be non-empty and fit a CV section (the save would reject anything longer). */
export const sectionContentSchema = z
  .object({ content: z.string() })
  .transform(({ content }) => content.trim())
  .refine(
    (content) =>
      content.length > 0 && content.length <= AI_INPUT_LIMITS.sectionContent,
  );

export function buildCvSectionPrompt(req: AiCvSectionRequest): BuiltPrompt {
  const current = clampText(req.currentContent, AI_INPUT_LIMITS.sectionContent);
  const jobDescription = clampText(
    req.jobDescription,
    AI_INPUT_LIMITS.jobDescriptionContext,
  ).text;
  const jobTitle = singleLine(req.jobTitle, AI_INPUT_LIMITS.shortText);
  const context = buildCvContext(req.allSections);
  const label = `the "${singleLine(req.sectionTitle, 100) || "Untitled"}" section (type: ${toSectionType(req.sectionType)})`;

  const sources = [
    current.text && "<notes>",
    context && "<cv_context>",
    jobDescription && "<job_description>",
  ].filter(Boolean);

  const lines: string[] = [];
  if (req.action === "generate") {
    lines.push(
      `Write ${label} of my CV.${sources.length > 0 ? ` Use only facts from ${sources.join(", ")}.` : ""}`,
    );
    if (!current.text) {
      lines.push(
        context
          ? "I have not written notes for this section yet. If <cv_context> has enough relevant facts, write the section from them; otherwise return a short placeholder telling me which details to add."
          : "I have not written notes for this section yet: return a short placeholder telling me which details to add.",
      );
    }
  } else if (req.action === "improve") {
    lines.push(
      `Improve ${label} of my CV: stronger verbs, tighter wording, cleaner formatting. Keep all of the information in <section_content>.`,
    );
  } else {
    lines.push(
      `Tailor ${label} of my CV to the target role: reorder and reword so the most relevant experience comes first. Keep all of the information in <section_content>.`,
    );
  }
  if (jobTitle) lines.push(`Target role: ${jobTitle}`);

  const blocks: string[] = [];
  if (current.text) {
    blocks.push(
      dataBlock(req.action === "generate" ? "notes" : "section_content", current.text),
    );
  }
  if (jobDescription) blocks.push(dataBlock("job_description", jobDescription));
  if (context) blocks.push(dataBlock("cv_context", context));

  return {
    system: SECTION_SYSTEM,
    user: [...lines, ...blocks].join("\n\n"),
    maxTokens:
      req.action === "generate"
        ? 1_500
        : rewriteTokenBudget(current.text.length, 1_200, 6_000),
    truncated: current.truncated,
  };
}

/* ── Full CV from a brain dump ────────────────────────────────────── */

const FULL_CV_SYSTEM = `You turn a software developer's brain-dump into a complete CV.
${CV_WRITING_RULES}
Extra formats allowed in content: [skill: X] badges and [rating: N/5] proficiency.
Section types: profile, experience, education, skills, projects, certifications, languages, interests, custom. Only include sections with real content, in this order: profile, experience, projects, skills, education, certifications, languages, interests.
Section formats:
- profile: 3-4 punchy sentences: core stack, years of experience, what the candidate is known for.
- experience: "### Company | Role | Date range" then "- " bullets.
- education: "### Institution | Degree | Years" then optional bullets.
- skills: "### Category" then "- Tech, Tech, Tech".
- projects: "### Name | Stack" then bullets (what it does, key decisions, links).
- certifications: "- **Name** — Issuer, Year".
- languages: "- **Language** — Level [rating: N/5]".
${ACCURACY_RULES}
Sparse input → a short CV. When a target role or job description is given, lead with the most relevant skills and experience.
${DATA_BLOCK_RULE}
Respond with a JSON object:
{"name": "", "email": "", "phone": "", "location": "", "website": "", "linkedin": "", "github": "", "sections": [{"title": "", "sectionType": "", "content": ""}]}
Use "" for contact details the candidate did not give. The section title goes in "title", never in "content".`;

const MAX_FULL_CV_SECTIONS = 30;

export function buildFullCvPrompt(req: AiFullCvFromTextRequest): BuiltPrompt {
  const rawText = clampText(req.rawText, AI_INPUT_LIMITS.rawText);
  const jobDescription = clampText(
    req.jobDescription,
    AI_INPUT_LIMITS.jobDescriptionContext,
  ).text;
  const jobTitle = singleLine(req.jobTitle, AI_INPUT_LIMITS.shortText);
  const name = singleLine(req.userName, 120);

  const lines = [
    `Turn my brain-dump into my CV. Use only facts from <brain_dump>${jobDescription ? " and <job_description>" : ""}.`,
  ];
  if (name) lines.push(`My name: ${name}`);
  if (jobTitle) lines.push(`Target role: ${jobTitle}`);
  lines.push(dataBlock("brain_dump", rawText.text));
  if (jobDescription) lines.push(dataBlock("job_description", jobDescription));

  return {
    system: FULL_CV_SYSTEM,
    user: lines.join("\n\n"),
    maxTokens: rewriteTokenBudget(rawText.text.length, 2_500, 8_000),
    truncated: rawText.truncated,
  };
}

const contactField = (max: number) =>
  z.unknown().transform((value) => (typeof value === "string" ? singleLine(value, max) : ""));

const fullCvSectionSchema = z
  .object({
    title: z.unknown(),
    sectionType: z.unknown(),
    content: z.unknown(),
  })
  .transform((section): AiFullCvSection | null => {
    const content =
      typeof section.content === "string"
        ? section.content.trim().slice(0, AI_INPUT_LIMITS.sectionContent)
        : "";
    if (!content) return null;
    const sectionType = toSectionType(section.sectionType);
    const title =
      typeof section.title === "string" ? singleLine(section.title, 200) : "";
    return {
      title: title || sectionType.charAt(0).toUpperCase() + sectionType.slice(1),
      sectionType,
      content,
    };
  });

/** Lenient on shape, strict on the result: typed fields, valid section types, normalised links, ≥1 section. */
export const fullCvSchema = z
  .object({
    name: contactField(120),
    email: contactField(254),
    phone: contactField(40),
    location: contactField(120),
    website: contactField(AI_INPUT_LIMITS.url),
    linkedin: contactField(AI_INPUT_LIMITS.url),
    github: contactField(AI_INPUT_LIMITS.url),
    sections: z.array(z.unknown()),
  })
  .transform((cv): AiFullCvResult => {
    const sections = cv.sections
      .map((section) => fullCvSectionSchema.safeParse(section))
      .flatMap((parsed) => (parsed.success && parsed.data ? [parsed.data] : []))
      .slice(0, MAX_FULL_CV_SECTIONS);
    return {
      name: cv.name,
      email: normaliseEmail(cv.email),
      phone: cv.phone,
      location: cv.location,
      website: normaliseUrl(cv.website),
      linkedin: normaliseUrl(cv.linkedin),
      github: normaliseUrl(cv.github),
      sections,
    };
  })
  .refine((cv) => cv.sections.length > 0);
