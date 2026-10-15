import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
} from "@nestjs/common";
import type { ZodType, ZodTypeDef } from "zod";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { AiRunner } from "./ai-runner";
import { AiUsageService } from "./ai-usage.service";
import {
  AI_ACTIONS,
  AI_ERROR_MESSAGES,
  type AiAction,
  type AiCallProfile,
} from "./ai.constants";
import type {
  AiCallContext,
  AiCoverLetterRequest,
  AiCoverLetterRewriteRequest,
  AiCoverLetterSuggestRequest,
  AiCvSectionRequest,
  AiFullCvFromTextRequest,
  AiFullCvResult,
  AiTextResult,
  JobDescriptionAnalysis,
  TailorApplicationInput,
  TailorApplicationOutput,
  TechTestAiReviewResult,
  TechTestReviewInput,
} from "./ai.types";
import {
  buildCvSectionPrompt,
  buildFullCvPrompt,
  fullCvSchema,
  sectionContentSchema,
  type BuiltPrompt,
} from "./prompts/cv.prompts";
import {
  buildCoverLetterPrompt,
  buildRewritePrompt,
  buildSuggestPrompt,
  letterContentSchema,
  suggestionsSchema,
} from "./prompts/cover-letter.prompts";
import {
  buildAnalyzeJobPrompt,
  buildTailorLetterPrompt,
  buildTailorSectionsPrompt,
  isFaithfulTailoring,
  jobAnalysisSchema,
  pickTailorableSections,
  tailoredSectionsSchema,
} from "./prompts/jobs.prompts";
import { buildTechReviewPrompt, techReviewSchema } from "./prompts/tech-test.prompts";

export type {
  AiCvAction,
  AiFullCvResult,
  AiFullCvSection,
} from "./ai.types";

const MIN_RAW_TEXT_CHARS = 20;
const MIN_JOB_DESCRIPTION_CHARS = 50;

interface RunOptions {
  temperature: number;
  profile?: AiCallProfile;
  /** Overrides the label (defaults to the action) for multi-call actions. */
  label?: string;
}

/**
 * All user-facing AI writing. Each public method validates its input (400s
 * happen before any quota is reserved), reserves usage, runs the model for
 * the user's tier and records the outcome. Callers must NOT wrap these in
 * AiUsageService.withReservation (that would charge twice).
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly runner: AiRunner,
    private readonly usage: AiUsageService,
    private readonly entitlements: EntitlementsService,
  ) {}

  /* ── CV ─────────────────────────────────────────────────────────── */

  async generateCvSectionContent(
    userId: string,
    req: AiCvSectionRequest,
  ): Promise<AiTextResult> {
    if (req.action !== "generate" && !req.currentContent?.trim()) {
      throw new BadRequestException(
        "Add some content to this section before using AI improve or tailor.",
      );
    }
    if (req.action === "tailor" && !req.jobTitle?.trim() && !req.jobDescription?.trim()) {
      throw new BadRequestException(
        "Add a target role or job description to tailor this section to.",
      );
    }
    const prompt = buildCvSectionPrompt(req);
    const content = await this.reserveAndRun(
      userId,
      AI_ACTIONS.cvSection,
      prompt,
      sectionContentSchema,
      { temperature: 0.4 },
    );
    return { content, truncated: prompt.truncated };
  }

  async generateFullCvFromRawText(
    userId: string,
    req: AiFullCvFromTextRequest,
  ): Promise<AiFullCvResult & { truncated: boolean }> {
    if ((req.rawText ?? "").trim().length < MIN_RAW_TEXT_CHARS) {
      throw new BadRequestException(
        `Add a bit more detail (at least ${MIN_RAW_TEXT_CHARS} characters) so the AI has something to work with.`,
      );
    }
    const prompt = buildFullCvPrompt(req);
    const cv = await this.reserveAndRun(userId, AI_ACTIONS.cvFull, prompt, fullCvSchema, {
      temperature: 0.3,
      profile: "long",
    });
    return { ...cv, truncated: prompt.truncated };
  }

  /* ── Cover letters ──────────────────────────────────────────────── */

  async generateCoverLetterContent(
    userId: string,
    req: AiCoverLetterRequest,
  ): Promise<AiTextResult> {
    if (req.action !== "generate" && !req.currentBody?.trim()) {
      throw new BadRequestException(
        "Write or paste your cover letter before using AI improve or tailor.",
      );
    }
    if (
      req.action === "tailor" &&
      !req.jobTitle?.trim() &&
      !req.companyName?.trim() &&
      !req.jobDescription?.trim()
    ) {
      throw new BadRequestException(
        "Add a job title, company or job description to tailor this letter to.",
      );
    }
    const prompt = buildCoverLetterPrompt(req);
    const content = await this.reserveAndRun(
      userId,
      AI_ACTIONS.coverLetter,
      prompt,
      letterContentSchema,
      { temperature: req.action === "generate" ? 0.7 : 0.6 },
    );
    return { content, truncated: prompt.truncated };
  }

  async suggestCoverLetterImprovements(
    userId: string,
    req: AiCoverLetterSuggestRequest,
  ): Promise<string[]> {
    if (!req.body?.trim()) {
      throw new BadRequestException(
        "Write or paste your cover letter before asking for suggestions.",
      );
    }
    return this.reserveAndRun(
      userId,
      AI_ACTIONS.coverLetterSuggest,
      buildSuggestPrompt(req),
      suggestionsSchema,
      { temperature: 0.5 },
    );
  }

  async rewriteCoverLetter(
    userId: string,
    req: AiCoverLetterRewriteRequest,
  ): Promise<AiTextResult> {
    if (!req.body?.trim()) {
      throw new BadRequestException(
        "Write or paste your cover letter before rewriting it.",
      );
    }
    const prompt = buildRewritePrompt(req);
    const content = await this.reserveAndRun(
      userId,
      AI_ACTIONS.coverLetterRewrite,
      prompt,
      letterContentSchema,
      { temperature: 0.6 },
    );
    return { content, truncated: prompt.truncated };
  }

  /* ── Jobs ───────────────────────────────────────────────────────── */

  /** Structured facts from a job advert (1 AI action; free users get the light model). */
  async analyzeJobDescription(
    userId: string,
    jobDescription: string,
  ): Promise<JobDescriptionAnalysis> {
    if ((jobDescription ?? "").trim().length < MIN_JOB_DESCRIPTION_CHARS) {
      throw new BadRequestException(
        `Paste the full job description (at least ${MIN_JOB_DESCRIPTION_CHARS} characters).`,
      );
    }
    return this.reserveAndRun(
      userId,
      AI_ACTIONS.jobAnalyze,
      buildAnalyzeJobPrompt(jobDescription),
      jobAnalysisSchema,
      { temperature: 0.2 },
    );
  }

  /**
   * Premium tailor kit: rewrites the CV's profile/experience/skills sections
   * for one job (facts are only reordered and rephrased) and optionally writes
   * a matching cover letter. 1 AI action, 2 with the letter.
   */
  async tailorApplication(
    userId: string,
    input: TailorApplicationInput,
  ): Promise<TailorApplicationOutput> {
    await this.entitlements.assertPremium(userId, "tailorKit");
    if (!input.jobDescription?.trim()) {
      throw new BadRequestException(
        "Add the job description to this job before tailoring.",
      );
    }
    const sections = pickTailorableSections(input.sections);
    if (sections.length === 0) {
      throw new BadRequestException(
        "Your CV needs a profile, experience or skills section with content to tailor.",
      );
    }

    const sectionsPrompt = buildTailorSectionsPrompt(input, sections);
    const letterPrompt = input.includeCoverLetter
      ? buildTailorLetterPrompt(input)
      : null;

    return this.usage.withReservation(
      userId,
      AI_ACTIONS.tailorApplication,
      async (ctx) => {
        // Both calls run in parallel; wait for both (each is billed) before failing.
        const [sectionsRun, letterRun] = await Promise.allSettled([
          this.runPrompt(ctx, sectionsPrompt, tailoredSectionsSchema, {
            temperature: 0.4,
            profile: "long",
            label: "tailor-sections",
          }),
          letterPrompt
            ? this.runPrompt(ctx, letterPrompt, letterContentSchema, {
                temperature: 0.6,
                profile: "long",
                label: "tailor-letter",
              })
            : Promise.resolve(null),
        ]);
        if (sectionsRun.status === "rejected") throw sectionsRun.reason;
        if (letterRun.status === "rejected") throw letterRun.reason;
        const tailored = sectionsRun.value;
        const coverLetter = letterRun.value;

        const originals = new Map(sections.map((s) => [s.id, s]));
        const out: TailorApplicationOutput["sections"] = [];
        let kept = 0;
        for (const [key, id] of sectionsPrompt.keyToId) {
          const content = tailored.get(key);
          const original = originals.get(id);
          if (
            content &&
            original &&
            isFaithfulTailoring(original.content, content, original.sectionType)
          ) {
            out.push({ id, content });
          } else {
            kept++;
          }
        }
        if (kept > 0) {
          this.logger.warn(
            `tailor-application: kept the original text of ${kept} of ${sectionsPrompt.keyToId.size} section(s) (missing or failed the fact check)`,
          );
        }
        if (out.length === 0) {
          throw new BadGatewayException(AI_ERROR_MESSAGES.invalidOutput);
        }
        return { sections: out, coverLetter };
      },
      { units: letterPrompt ? 2 : 1 },
    );
  }

  /* ── Technical tests ────────────────────────────────────────────── */

  /** Premium AI review of a submitted take-home (1 AI action). */
  async reviewTechTestSubmission(
    userId: string,
    input: TechTestReviewInput,
  ): Promise<TechTestAiReviewResult> {
    await this.entitlements.assertPremium(userId, "aiTechReview");
    if (!input.submission?.trim()) {
      throw new BadRequestException("There is no submission to review.");
    }
    const prompt = buildTechReviewPrompt(input);
    return this.reserveAndRun(
      userId,
      AI_ACTIONS.techTestReview,
      prompt,
      techReviewSchema(prompt.criteria),
      { temperature: 0.3, profile: "long" },
    );
  }

  /* ── Internals ──────────────────────────────────────────────────── */

  private reserveAndRun<T>(
    userId: string,
    action: AiAction,
    prompt: BuiltPrompt,
    schema: ZodType<T, ZodTypeDef, unknown>,
    options: RunOptions,
  ): Promise<T> {
    return this.usage.withReservation(userId, action, (ctx) =>
      this.runPrompt(ctx, prompt, schema, { label: action, ...options }),
    );
  }

  private runPrompt<T>(
    ctx: AiCallContext,
    prompt: BuiltPrompt,
    schema: ZodType<T, ZodTypeDef, unknown>,
    options: RunOptions,
  ): Promise<T> {
    return this.runner.runJson({
      label: options.label ?? "ai",
      model: ctx.model,
      system: prompt.system,
      user: prompt.user,
      schema,
      maxTokens: prompt.maxTokens,
      temperature: options.temperature,
      // Large rewrites can take a while: give them the long, no-retry profile.
      profile: options.profile ?? (prompt.maxTokens > 2_000 ? "long" : "short"),
      onUsage: ctx.recordTokens,
    });
  }
}
