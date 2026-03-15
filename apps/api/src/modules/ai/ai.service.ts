import {
  Injectable,
  Inject,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import OpenAI from "openai";
import { OPENAI_CLIENT } from "./openai.provider";

export type AiCvAction = "generate" | "improve" | "tailor";

export interface AiFullCvFromTextRequest {
  rawText: string;
  jobTitle?: string;
  jobDescription?: string;
  userName?: string;
}

export interface AiFullCvSection {
  title: string;
  sectionType: string;
  content: string;
}

export interface AiFullCvResult {
  name: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  sections: AiFullCvSection[];
}

export interface AiCvSectionRequest {
  action: AiCvAction;
  sectionType: string;
  sectionTitle: string;
  currentContent?: string;
  jobTitle?: string;
  jobDescription?: string;
  allSections?: { title: string; sectionType: string; content: string }[];
  userName?: string;
}

export interface AiCoverLetterRequest {
  action: "generate" | "improve" | "tailor";
  currentBody?: string;
  jobTitle?: string;
  jobDescription?: string;
  companyName?: string;
  companyUrl?: string;
  cvSections?: { title: string; sectionType: string; content: string }[];
  userName?: string;
  tone?: "professional" | "friendly";
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

  /* ───────────────────────── CV Section ───────────────────────── */

  async generateCvSectionContent(req: AiCvSectionRequest): Promise<string> {
    const systemPrompt = this.buildCvSystemPrompt(req);
    const userPrompt = this.buildCvUserPrompt(req);

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.4,
        max_tokens: 1500,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      return response.choices[0]?.message?.content?.trim() || "";
    } catch (error) {
      this.logger.error("OpenAI CV section generation failed", error);
      throw new InternalServerErrorException(
        this.extractOpenAiErrorMessage(error)
      );
    }
  }

  private buildCvSystemPrompt(req: AiCvSectionRequest): string {
    const sectionContext = req.allSections
      ?.filter((s) => s.content.trim().length > 0)
      .map((s) => `[${s.title}]\n${s.content}`)
      .join("\n\n");

    return `You are a developer writing your own CV. First-person implied, never third person. Direct, technical, no fluff.

Format: **bold** for emphasis, ### Company | Role | Dates for entries, - for bullets, [links](url). Only ### headings — no ## or #. No code blocks/tables/HTML. No section title in output. Return ONLY content, no preamble.
Verbs: Built, Shipped, Architected, Migrated, Optimised, Scaled, Deployed, Owned. Quantify where possible. No filler ("responsible for" → "Owned").
Size: profile ~3-5 lines, experience ~3-5 bullets/role, skills as categorised lists.

Anti-hallucination (critical): Preserve every skill, tech, qualification and achievement the user wrote — never drop anything. You may add relevant skills from the job description as additions only. Never invent anything not in user content or job description. Never fabricate metrics.${
      sectionContext ? `\n\nCV context (do not repeat):\n${sectionContext}` : ""
    }`;
  }

  private buildCvUserPrompt(req: AiCvSectionRequest): string {
    const {
      action,
      sectionType,
      sectionTitle,
      currentContent,
      jobTitle,
      jobDescription,
    } = req;

    if (action === "generate") {
      let prompt = `Generate professional content for a CV "${sectionTitle}" section (type: ${sectionType}). IMPORTANT: Only include skills and technologies that are explicitly mentioned in my notes below, in the other CV sections provided as context, or in the job description if provided. Do not invent any skills beyond those sources.`;
      if (jobTitle) prompt += `\nThe user's target role is: ${jobTitle}.`;
      if (jobDescription)
        prompt += `\nTarget job description (you may include relevant skills from this):\n${jobDescription}`;
      if (currentContent?.trim())
        prompt += `\nThe user has started writing some notes — use them as a base and expand into polished CV content:\n${currentContent}`;
      else
        prompt += `\nNote: The user has not provided any notes yet. Without any input to work from, produce a minimal placeholder and ask the user to add their details.`;
      return prompt;
    }

    if (action === "improve") {
      return `Improve and polish this CV "${sectionTitle}" section content. Make it more impactful with stronger action verbs, better quantification, and cleaner formatting. Keep the same information but make it significantly more compelling:\n\n${currentContent}`;
    }

    // tailor
    let prompt = `Rewrite this CV "${sectionTitle}" section to be specifically tailored for the following role.
CRITICAL: You MUST keep ALL of the user's existing content — every skill, qualification, degree, certification, and achievement they wrote must appear in your output. Do not drop or omit anything. Then you may add relevant skills from the job description on top of what the user already has.`;
    if (jobTitle) prompt += `\nTarget role: ${jobTitle}`;
    if (jobDescription) prompt += `\nJob description:\n${jobDescription}`;
    prompt += `\n\nCurrent content to tailor:\n${currentContent}`;
    return prompt;
  }

  /* ──────────── Full CV from Raw Text ──────────── */

  async generateFullCvFromRawText(
    req: AiFullCvFromTextRequest
  ): Promise<AiFullCvResult> {
    const systemPrompt = `You are a developer writing your own CV from a brain-dump. First-person implied. Direct, technical, no fluff.

Output ONLY a valid JSON object:
{"name":"","email":"","phone":"","location":"","website":"","linkedin":"","github":"","sections":[{"title":"","sectionType":"","content":""}]}

Format rules: **bold** emphasis, ### Company | Role | Dates entries, - bullets, [links](url), [skill: X] badges, [rating: N/5] proficiency. Only ### headings. No code blocks/tables/HTML. Section title goes in "title" field, not content.

sectionTypes: profile, experience, education, skills, projects, certifications, languages, interests, custom. Only include sections with real content.
Order: Profile → Experience → Projects → Skills → Education → Certifications → Languages → Interests.

Section formats:
- profile: 3-4 sentence punchy summary. Core stack, years of experience, what you're known for. Only skills user mentioned.
- experience: ### Company | Role | Date Range\\n- Built X using Y\\n- Scaled Z by N%
- education: ### University | Degree | Years\\n- Coursework/honours
- skills: grouped ### Category\\n- Tech, Tech, Tech
- projects: ### Name | Stack\\n- What it does, decisions\\n- [GitHub](url)
- certifications: - **Name** — Issuer, Year
- languages: - **Lang** — Level [rating: N/5]

Verbs: Built, Shipped, Architected, Migrated, Optimised, Scaled, Deployed, Owned. Remove filler. Fix grammar. No padding.

Anti-hallucination (critical): Preserve ALL user content. Job description skills are additions only. Never invent tech/metrics/achievements not in user input or job description. Sparse input → short CV.
Tailoring: lead Profile with user's most relevant skills, emphasise matching Experience bullets, prioritise matching Skills. Never fabricate missing skills.

Return ONLY the JSON. No preamble, no code fences.`;

    let userPrompt = `Convert this brain-dump into my CV. Only use skills/tech from my text and the job description — invent nothing:\n\n${req.rawText}`;
    if (req.jobTitle) userPrompt += `\n\nTargeting: ${req.jobTitle}.`;
    if (req.jobDescription)
      userPrompt += `\n\nJob description:\n${req.jobDescription}`;
    if (req.userName) userPrompt += `\n\nMy name: ${req.userName}.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.3,
        max_tokens: 4000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const raw = response.choices[0]?.message?.content?.trim() || "{}";

      // Strip code fences if the model wraps them
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      try {
        const parsed = JSON.parse(cleaned);
        return {
          name: parsed.name || "",
          email: parsed.email || "",
          phone: parsed.phone || "",
          location: parsed.location || "",
          website: parsed.website || "",
          linkedin: parsed.linkedin || "",
          github: parsed.github || "",
          sections: Array.isArray(parsed.sections)
            ? parsed.sections.map(
                (s: {
                  title?: string;
                  sectionType?: string;
                  content?: string;
                }) => ({
                  title: s.title || "Untitled",
                  sectionType: s.sectionType || "custom",
                  content: s.content || "",
                })
              )
            : [],
        };
      } catch {
        this.logger.error("Failed to parse AI full CV JSON response", raw);
        throw new InternalServerErrorException(
          "AI returned an invalid response. Please try again."
        );
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error("OpenAI full CV generation failed", error);
      throw new InternalServerErrorException(
        this.extractOpenAiErrorMessage(error)
      );
    }
  }

  /* ──────────────────── Cover Letter ──────────────────────── */

  async generateCoverLetterContent(req: AiCoverLetterRequest): Promise<string> {
    const systemPrompt = this.buildCoverLetterSystemPrompt(req);
    const userPrompt = this.buildCoverLetterUserPrompt(req);

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.75,
        max_tokens: 2000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      return response.choices[0]?.message?.content?.trim() || "";
    } catch (error) {
      this.logger.error("OpenAI cover letter generation failed", error);
      throw new InternalServerErrorException(
        this.extractOpenAiErrorMessage(error)
      );
    }
  }

  async suggestCoverLetterImprovements(
    body: string,
    jobTitle?: string,
    companyName?: string,
    jobDescription?: string
  ): Promise<string[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.6,
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content: `Career coach reviewing a cover letter. Give 3-6 specific, actionable improvement suggestions. Return ONLY a JSON string array.`,
          },
          {
            role: "user",
            content: `Suggest improvements:\n\n${body}${
              jobTitle ? `\n\nRole: ${jobTitle}` : ""
            }${companyName ? ` at ${companyName}` : ""}${
              jobDescription ? `\n\nJD:\n${jobDescription}` : ""
            }`,
          },
        ],
      });

      const raw = response.choices[0]?.message?.content?.trim() || "[]";
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [raw];
      }
    } catch (error) {
      this.logger.error("OpenAI suggest improvements failed", error);
      throw new InternalServerErrorException(
        this.extractOpenAiErrorMessage(error)
      );
    }
  }

  async rewriteCoverLetter(
    body: string,
    tone: "professional" | "friendly",
    jobTitle?: string,
    companyName?: string
  ): Promise<string> {
    const toneInstruction =
      tone === "professional"
        ? "Polished, formal tone."
        : "Warm, personable tone while staying professional.";

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.7,
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content: `Expert cover letter writer. ${toneInstruction} Keep core message intact. Structure: greeting, intro, 2-3 body paragraphs, closing. No placeholder brackets. Return ONLY the letter.`,
          },
          {
            role: "user",
            content: `Rewrite${
              jobTitle
                ? ` for a ${jobTitle} role${
                    companyName ? ` at ${companyName}` : ""
                  }`
                : ""
            }:\n\n${body}`,
          },
        ],
      });

      return response.choices[0]?.message?.content?.trim() || "";
    } catch (error) {
      this.logger.error("OpenAI rewrite cover letter failed", error);
      throw new InternalServerErrorException(
        this.extractOpenAiErrorMessage(error)
      );
    }
  }

  private buildCoverLetterSystemPrompt(req: AiCoverLetterRequest): string {
    const toneInstruction =
      req.tone === "friendly"
        ? "Warm, personable tone while staying professional."
        : "Polished, formal tone.";

    const cvContext = req.cvSections
      ?.filter((s) => s.content.trim().length > 0)
      .map((s) => `[${s.title}]\n${s.content}`)
      .join("\n\n");

    return `Expert cover letter writer. ${toneInstruction} Write greeting, 2-3 body paragraphs, closing. Highlight relevant CV experience. Show genuine enthusiasm. Reference company naturally if URL provided. No placeholder brackets. Return ONLY the letter.${
      cvContext ? `\n\nCV:\n${cvContext}` : ""
    }`;
  }

  private buildCoverLetterUserPrompt(req: AiCoverLetterRequest): string {
    const {
      action,
      currentBody,
      jobTitle,
      companyName,
      companyUrl,
      jobDescription,
      userName,
    } = req;

    if (action === "generate") {
      let prompt = "Generate a complete cover letter";
      if (userName) prompt += ` for ${userName}`;
      if (jobTitle) prompt += ` applying for a ${jobTitle} role`;
      if (companyName) prompt += ` at ${companyName}`;
      prompt += ".";
      if (companyUrl) prompt += `\n\nCompany website: ${companyUrl}`;
      if (jobDescription) prompt += `\n\nJob description:\n${jobDescription}`;
      if (currentBody?.trim())
        prompt += `\n\nThe user has written some initial notes to incorporate:\n${currentBody}`;
      return prompt;
    }

    if (action === "improve") {
      let prompt = `Improve this cover letter — make it more compelling, better structured, and more impactful while keeping the user's voice:\n\n${currentBody}`;
      if (jobTitle) prompt += `\n\nTarget role: ${jobTitle}`;
      if (companyName) prompt += ` at ${companyName}`;
      if (companyUrl) prompt += `\nCompany website: ${companyUrl}`;
      return prompt;
    }

    // tailor
    let prompt = `Rewrite this cover letter to be specifically tailored for`;
    if (jobTitle) prompt += ` a ${jobTitle} role`;
    if (companyName) prompt += ` at ${companyName}`;
    prompt += ".";
    if (companyUrl) prompt += `\n\nCompany website: ${companyUrl}`;
    if (jobDescription) prompt += `\n\nJob description:\n${jobDescription}`;
    prompt += `\n\nCurrent cover letter:\n${currentBody}`;
    return prompt;
  }

  private extractOpenAiErrorMessage(error: unknown): string {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return "AI service authentication failed. Please check the OpenAI API key configuration.";
      }
      if (error.status === 429) {
        return "AI rate limit reached. Please try again in a moment.";
      }
      if (error.status === 503 || error.status === 500) {
        return "AI service is temporarily unavailable. Please try again later.";
      }
      return `AI service error: ${error.message}`;
    }
    return "An unexpected error occurred while generating AI content. Please try again.";
  }
}
