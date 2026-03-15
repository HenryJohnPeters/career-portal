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
        temperature: 0.7,
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

    return `You are a developer writing your own CV. You write as if YOU are this person — first person implied, never third person. Direct, technical, no corporate fluff.

Rules:
- Write in implied first person: "Built a real-time pipeline…" NOT "He built…" or "The candidate built…"
- Sound like a confident developer — specific, technical, concise.
- Use **bold** for emphasis, ### with pipes for structured entries (### Company | Role | Dates), - for bullet points, [links](url) where appropriate.
- Do NOT use ##, #, or any heading level other than ### — only ### is supported by the renderer.
- Do NOT use code blocks, tables, or HTML tags.
- Use strong action verbs: Built, Shipped, Architected, Migrated, Optimised, Automated, Scaled, Deployed, Owned.
- Quantify achievements where possible (percentages, users, latency, team size, timeframes).
- Remove filler ("responsible for", "helped with") — replace with direct statements ("Owned", "Built").
- Do NOT include the section title itself — the user already has that.
- Do NOT wrap the output in code fences or add any preamble/explanation — return ONLY the section content.
- Keep content appropriately sized: profile ~3-5 lines, experience ~3-5 bullet points per role, skills as categorised lists.
${
  sectionContext
    ? `\nHere is the rest of this CV for context (do not repeat information already covered):\n\n${sectionContext}`
    : ""
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
      let prompt = `Generate professional content for a CV "${sectionTitle}" section (type: ${sectionType}).`;
      if (jobTitle) prompt += `\nThe user's target role is: ${jobTitle}.`;
      if (jobDescription)
        prompt += `\nTarget job description:\n${jobDescription}`;
      if (currentContent?.trim())
        prompt += `\nThe user has started writing some notes — use them as a base and expand into polished CV content:\n${currentContent}`;
      return prompt;
    }

    if (action === "improve") {
      return `Improve and polish this CV "${sectionTitle}" section content. Make it more impactful with stronger action verbs, better quantification, and cleaner formatting. Keep the same information but make it significantly more compelling:\n\n${currentContent}`;
    }

    // tailor
    let prompt = `Rewrite this CV "${sectionTitle}" section to be specifically tailored for the following role.`;
    if (jobTitle) prompt += `\nTarget role: ${jobTitle}`;
    if (jobDescription) prompt += `\nJob description:\n${jobDescription}`;
    prompt += `\n\nCurrent content to tailor:\n${currentContent}`;
    return prompt;
  }

  /* ──────────── Full CV from Raw Text ──────────── */

  async generateFullCvFromRawText(
    req: AiFullCvFromTextRequest
  ): Promise<AiFullCvResult> {
    const systemPrompt = `You are a senior software developer writing your own CV. You take the user's messy brain-dump about their career and rewrite it as YOUR OWN polished CV — first person implied, never third person. You ARE this developer.

Your output MUST be a valid JSON object with this exact shape:
{
  "name": "string or empty",
  "email": "string or empty",
  "phone": "string or empty",
  "location": "string or empty",
  "website": "string or empty",
  "linkedin": "string or empty",
  "github": "string or empty",
  "sections": [
    { "title": "string", "sectionType": "string", "content": "string (markdown)" }
  ]
}

VOICE & TONE:
- Write in FIRST PERSON implied (no "he/she/they", no "the candidate", no "Mr. Smith").
- Use the natural CV voice: "Built a real-time data pipeline…" not "He built a real-time data pipeline…"
- Sound like a confident developer writing about themselves — direct, technical, no corporate fluff.
- Be specific and technical. Mention actual technologies, frameworks, patterns, and architecture decisions.

FORMATTING RULES (critical — the content gets rendered by a markdown→HTML engine):
- Use **bold** for emphasis (company names, tech stacks, key metrics).
- Use ### with pipes for structured entries: ### Company Name | Role Title | Date Range
- Use - for bullet points.
- Use [link text](url) for links.
- Use [skill: React] for inline skill badges.
- Use [rating: 4/5] for language proficiency dots.
- Do NOT use ##, #, or any heading level other than ### — only ### is supported.
- Do NOT use code blocks, tables, or HTML tags.
- Do NOT include the section title in the content — it goes in the "title" field.

SECTION RULES:
1. EXTRACT all contact info (name, email, phone, location, website, linkedin, github) from the text. If not found, leave as empty string.
2. Use these sectionTypes: "profile", "experience", "education", "skills", "projects", "certifications", "languages", "interests", "custom". Only include sections that have real content.
3. Always include a "Profile" section (sectionType: "profile") — write a punchy 3-4 sentence summary as if introducing yourself. Developer-focused: mention years of experience, core stack, what you're known for, what you care about. No generic waffle.
4. For "Experience" (sectionType: "experience"), format each role as:
   ### Company Name | Role Title | Jan 2023 – Present
   - Built/Led/Shipped [specific thing] using [specific tech]
   - Reduced/Improved/Scaled [metric] by [number]% through [what you did]
   - Owned [area of responsibility], collaborated with [who]
5. For "Education" (sectionType: "education"):
   ### University Name | BSc Computer Science | 2016 – 2020
   - Relevant coursework, thesis, honours
6. For "Skills" (sectionType: "skills"), group into labelled categories:
   ### Languages & Frameworks
   - TypeScript, JavaScript, Python, Go
   ### Infrastructure & DevOps
   - AWS, Docker, Kubernetes, Terraform
   ### Databases
   - PostgreSQL, Redis, MongoDB
7. For "Projects" (sectionType: "projects"):
   ### Project Name | React, Node.js, PostgreSQL
   - What it does, who uses it, key technical decisions
   - [View Project](https://example.com) or [GitHub](https://github.com/...)
8. For "Certifications" (sectionType: "certifications"):
   - **AWS Solutions Architect Associate** — Amazon Web Services, 2024
9. For "Languages" (sectionType: "languages"):
   - **English** — Native [rating: 5/5]
   - **Spanish** — Conversational [rating: 3/5]

REWRITING RULES:
- Use strong developer-appropriate action verbs: Built, Shipped, Architected, Migrated, Optimised, Automated, Designed, Debugged, Refactored, Scaled, Deployed, Maintained, Owned.
- Quantify everything you can — users, requests/sec, latency reduction, team size, lines of code, uptime, deployment frequency.
- Be honest. If the raw text is vague, write something reasonable but don't fabricate numbers or achievements that weren't implied.
- Remove filler ("responsible for", "helped with", "was involved in") — replace with direct statements ("Owned", "Built", "Shipped").
- Fix grammar, spelling, and inconsistencies.
- Keep it tight. No padding sentences. Every line should earn its place.

ORDER: Profile → Experience → Projects → Skills → Education → Certifications → Languages → Interests.

TAILORING (if a job description is provided):
- Carefully read the job description and identify the key skills, technologies, responsibilities, and qualifications the employer is looking for.
- Tailor the Profile section to directly address the role's core requirements — lead with the most relevant experience and skills.
- In Experience, emphasise bullet points and achievements that align with the job description. Reorder or expand relevant points, and de-emphasise less relevant ones.
- In Skills, prioritise and lead with technologies and tools mentioned in the job description.
- Use keywords and phrases from the job description naturally throughout the CV (this helps with ATS screening).
- Do NOT fabricate experience or skills — only highlight and reframe what the user actually has.

Return ONLY the JSON object. No preamble, no explanation, no code fences.`;

    let userPrompt = `Here's my raw brain-dump. Turn this into my CV:\n\n${req.rawText}`;
    if (req.jobTitle)
      userPrompt += `\n\nI'm targeting a ${req.jobTitle} role — tailor my profile and skill emphasis for that.`;
    if (req.jobDescription)
      userPrompt += `\n\nHere's the job description for context:\n${req.jobDescription}`;
    if (req.userName) userPrompt += `\n\nMy name is ${req.userName}.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.6,
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
            content: `You are an expert career coach reviewing a cover letter. Provide specific, actionable suggestions to improve it. Return a JSON array of strings, each being one suggestion. Return ONLY the JSON array, no extra text.`,
          },
          {
            role: "user",
            content: `Review this cover letter and provide 3-6 specific improvement suggestions:\n\n${body}${
              jobTitle ? `\n\nTarget role: ${jobTitle}` : ""
            }${companyName ? ` at ${companyName}` : ""}${
              jobDescription ? `\n\nJob description:\n${jobDescription}` : ""
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
        ? "Use a polished, formal, corporate-appropriate tone."
        : "Use a warm, personable, approachable tone while staying professional.";

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.7,
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content: `You are an expert cover letter writer. Rewrite the user's cover letter in a ${tone} tone. ${toneInstruction}\n\nRules:\n- Keep the core message and key points intact.\n- Improve structure: greeting, intro, body (2-3 paragraphs), closing.\n- Do NOT add placeholder brackets like [Company Name] — use whatever info is available.\n- Return ONLY the rewritten letter, no preamble.`,
          },
          {
            role: "user",
            content: `Rewrite this cover letter${
              jobTitle
                ? ` (for a ${jobTitle} role${
                    companyName ? ` at ${companyName}` : ""
                  })`
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
        ? "Use a warm, personable, approachable tone while staying professional."
        : "Use a polished, formal, corporate-appropriate tone.";

    const cvContext = req.cvSections
      ?.filter((s) => s.content.trim().length > 0)
      .map((s) => `[${s.title}]\n${s.content}`)
      .join("\n\n");

    return `You are an expert cover letter writer who creates compelling, personalised cover letters.

Rules:
- Write a complete cover letter with proper greeting, 2-3 body paragraphs, and closing.
- ${toneInstruction}
- Highlight relevant experience and skills from the CV if provided.
- Show genuine enthusiasm for the role and company.
- If a company URL is provided, reference the company naturally — mention their mission, products, or industry where appropriate.
- Do NOT use generic placeholder brackets like [Your Name] or [Company] — use the information provided or write naturally without them.
- Return ONLY the cover letter text, no preamble or explanation.
${cvContext ? `\nUser's CV for reference:\n\n${cvContext}` : ""}`;
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
