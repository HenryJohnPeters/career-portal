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
  AiCoverLetterRequest,
  AiCoverLetterRewriteRequest,
  AiCoverLetterSuggestRequest,
  CoverLetterTone,
} from "../ai.types";
import { buildCvContext } from "./shared";
import type { BuiltPrompt } from "./cv.prompts";

const TONES: Record<CoverLetterTone, string> = {
  professional: "Polished, formal tone.",
  friendly: "Warm, personable tone while staying professional.",
};

const LETTER_RULES = `Structure: greeting, 2-3 short body paragraphs, closing and sign-off; 250-400 words. Plain text with a blank line between paragraphs (no Markdown).
Never use placeholder brackets such as [Company] or [Your Name]: if a detail is unknown, write around it, and sign off with the candidate's name only when it is given.
Use only facts from the candidate's CV, letter or notes. Never invent employers, job titles, dates, qualifications, metrics or achievements.
${DATA_BLOCK_RULE}
Respond with a JSON object: {"content": "<the full letter>"}.`;

/** Output must be a non-empty letter that fits the cover-letter body limit. */
export const letterContentSchema = z
  .object({ content: z.string() })
  .transform(({ content }) => content.trim())
  .refine(
    (content) =>
      content.length > 0 && content.length <= AI_INPUT_LIMITS.coverLetterBody,
  );

function toneInstruction(tone: string | undefined): string {
  return tone === "friendly" ? TONES.friendly : TONES.professional;
}

function roleLine(jobTitle?: string, companyName?: string): string {
  const role = singleLine(jobTitle, AI_INPUT_LIMITS.shortText);
  const company = singleLine(companyName, AI_INPUT_LIMITS.shortText);
  if (role && company) return `the ${role} role at ${company}`;
  if (role) return `a ${role} role`;
  if (company) return `a role at ${company}`;
  return "";
}

export function buildCoverLetterPrompt(req: AiCoverLetterRequest): BuiltPrompt {
  const body = clampText(req.currentBody, AI_INPUT_LIMITS.coverLetterBody);
  const jobDescription = clampText(
    req.jobDescription,
    AI_INPUT_LIMITS.jobDescriptionContext,
  ).text;
  const cv = req.useCv === false ? "" : buildCvContext(req.cvSections);
  const target = roleLine(req.jobTitle, req.companyName);
  const name = singleLine(req.userName, 120);
  const url = singleLine(req.companyUrl, AI_INPUT_LIMITS.url);

  const lines: string[] = [];
  if (req.action === "generate") {
    lines.push(
      `Write a complete cover letter${target ? ` for ${target}` : ""}.${cv ? " Highlight the most relevant experience from <cv>." : ""}${body.text ? " Incorporate my <notes>." : ""}`,
    );
  } else if (req.action === "improve") {
    lines.push(
      `Improve my cover letter${target ? ` for ${target}` : ""}: more compelling and better structured, keeping my voice and every fact. The letter is in <cover_letter>.`,
    );
  } else {
    lines.push(
      `Rewrite my cover letter so it is tailored to ${target || "the job described in <job_description>"}. Keep every fact; the letter is in <cover_letter>.`,
    );
  }
  if (name) lines.push(`Candidate name: ${name}`);
  if (url) lines.push(`Company website (for reference only, do not visit): ${url}`);

  if (body.text) {
    lines.push(
      dataBlock(req.action === "generate" ? "notes" : "cover_letter", body.text),
    );
  }
  if (jobDescription) lines.push(dataBlock("job_description", jobDescription));
  if (cv) lines.push(dataBlock("cv", cv));

  return {
    system: `You are an expert cover-letter writer helping a job seeker. ${toneInstruction(req.tone)}\n${LETTER_RULES}`,
    user: lines.join("\n\n"),
    maxTokens:
      req.action === "generate"
        ? 1_200
        : rewriteTokenBudget(body.text.length, 1_200, 5_000),
    truncated: req.action === "generate" ? false : body.truncated,
  };
}

/* ── Suggestions ──────────────────────────────────────────────────── */

const SUGGEST_SYSTEM = `You are a career coach reviewing a cover letter. Give 3-6 specific, actionable improvement suggestions, each one or two sentences, most important first.
${DATA_BLOCK_RULE}
Respond with a JSON object: {"suggestions": ["…", "…"]}.`;

/** 1-6 non-empty strings, each ≤ 500 chars; anything else in the array is dropped. */
export const suggestionsSchema = z
  .object({ suggestions: z.unknown() })
  .transform(({ suggestions }) => cleanStringList(suggestions, 6, 500))
  .refine((suggestions) => suggestions.length > 0);

export function buildSuggestPrompt(req: AiCoverLetterSuggestRequest): BuiltPrompt {
  const body = clampText(req.body, AI_INPUT_LIMITS.coverLetterBody);
  const jobDescription = clampText(
    req.jobDescription,
    AI_INPUT_LIMITS.jobDescriptionContext,
  ).text;
  const target = roleLine(req.jobTitle, req.companyName);

  const lines = [
    `Suggest improvements to my cover letter${target ? ` for ${target}` : ""}.`,
    dataBlock("cover_letter", body.text),
  ];
  if (jobDescription) lines.push(dataBlock("job_description", jobDescription));

  return {
    system: SUGGEST_SYSTEM,
    user: lines.join("\n\n"),
    maxTokens: 1_000,
    truncated: body.truncated,
  };
}

/* ── Tone rewrite ─────────────────────────────────────────────────── */

export function buildRewritePrompt(req: AiCoverLetterRewriteRequest): BuiltPrompt {
  const body = clampText(req.body, AI_INPUT_LIMITS.coverLetterBody);
  const target = roleLine(req.jobTitle, req.companyName);
  return {
    system: `You are an expert cover-letter writer. Rewrite the letter in a new tone, keeping its core message and every fact. ${toneInstruction(req.tone)}\n${LETTER_RULES}`,
    user: [
      `Rewrite my cover letter${target ? ` for ${target}` : ""}.`,
      dataBlock("cover_letter", body.text),
    ].join("\n\n"),
    maxTokens: rewriteTokenBudget(body.text.length, 1_200, 5_000),
    truncated: body.truncated,
  };
}
