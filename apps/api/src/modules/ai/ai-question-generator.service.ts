import { Injectable, Inject, Logger } from "@nestjs/common";
import OpenAI from "openai";
import * as crypto from "crypto";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { OPENAI_CLIENT } from "./openai.provider";
import {
  DIFFICULTY_MAP,
  DIFFICULTY_RANGES,
  AI_QUESTION_POOL_THRESHOLD,
  AI_QUESTION_BATCH_SIZE,
  AI_GENERATION_COOLDOWN_MS,
  AI_URGENT_COOLDOWN_MS,
  AI_MAX_USER_DAILY_GENERATIONS,
  AI_BACKGROUND_BUDGET,
  AI_PIGGYBACK_CHANCE,
  sanitiseTags,
} from "../../common/constants";

export interface QuestionGenerationFilters {
  track: string;
  level: string;
  difficulty: string;
  tags: string[];
}

interface GeneratedQuestion {
  track: string;
  tags: string[];
  difficulty: number;
  type: string;
  level: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  correctOptionIndices: number[];
  multiSelect: boolean;
  expectedPoints: string[];
  redFlags: string[];
  rubric: { criteria: { name: string; weight: number; keywords: string[] }[] };
  modelAnswer: string;
  followUpIds: string[];
}

interface ParsedGeneratedQuestion {
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  correctOptionIndices?: number[];
  multiSelect?: boolean;
  type?: string;
  expectedPoints?: string[];
  redFlags?: string[];
  rubric?: {
    criteria?: { name: string; weight: number; keywords: string[] }[];
  };
  modelAnswer: string;
}

/** All track/level/difficulty combinations used in background fill. */
const BACKGROUND_FILL_COMBOS: QuestionGenerationFilters[] = (() => {
  const tracks = ["frontend", "backend", "fullstack", "devops"];
  const levels = ["junior", "mid", "senior"];
  const difficulties = ["easy", "medium", "hard"];
  const combos: QuestionGenerationFilters[] = [];
  for (const track of tracks) {
    for (const level of levels) {
      for (const difficulty of difficulties) {
        combos.push({ track, level, difficulty, tags: [] });
      }
    }
  }
  return combos;
})();

@Injectable()
export class AiQuestionGeneratorService {
  private readonly logger = new Logger(AiQuestionGeneratorService.name);

  constructor(
    @Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Compute a stable hash for a filter combination.
   */
  computeFilterHash(filters: QuestionGenerationFilters): string {
    const normalized = {
      track: filters.track,
      level: filters.level,
      difficulty: filters.difficulty,
      tags: [...filters.tags].sort().map((t) => t.toLowerCase()),
    };
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(normalized))
      .digest("hex")
      .slice(0, 16);
  }

  /**
   * Count how many questions exist in the pool for a given filter combo.
   */
  async getPoolSize(filters: QuestionGenerationFilters): Promise<number> {
    const where: Prisma.InterviewQuestionWhereInput = {
      track: filters.track,
      level: filters.level,
    };

    const range = DIFFICULTY_RANGES[filters.difficulty];
    if (range) where.difficulty = range;

    if (filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags.map((t) => t.toLowerCase()) };
    }

    return this.prisma.interviewQuestion.count({ where });
  }

  private toFilterComboJson(
    filters: QuestionGenerationFilters,
  ): Prisma.InputJsonValue {
    return {
      track: filters.track,
      level: filters.level,
      difficulty: filters.difficulty,
      tags: filters.tags,
    } as Prisma.InputJsonObject;
  }

  private isParsedGeneratedQuestion(
    value: unknown,
  ): value is ParsedGeneratedQuestion {
    if (!value || typeof value !== "object") return false;
    const q = value as Record<string, unknown>;

    return (
      typeof q.prompt === "string" &&
      Array.isArray(q.options) &&
      q.options.length >= 4 &&
      (q.options as unknown[]).every((option) => typeof option === "string") &&
      typeof q.correctOptionIndex === "number" &&
      Number.isFinite(q.correctOptionIndex) &&
      typeof q.modelAnswer === "string"
    );
  }

  private normalizeRubric(
    rubric: ParsedGeneratedQuestion["rubric"],
  ): GeneratedQuestion["rubric"] {
    if (!rubric?.criteria || !Array.isArray(rubric.criteria)) {
      return { criteria: [] };
    }

    const criteria = rubric.criteria
      .filter(
        (criterion) =>
          typeof criterion?.name === "string" &&
          typeof criterion?.weight === "number" &&
          Number.isFinite(criterion.weight) &&
          Array.isArray(criterion.keywords) &&
          criterion.keywords.every((keyword) => typeof keyword === "string"),
      )
      .map((criterion) => ({
        name: criterion.name,
        weight: Math.max(1, Math.min(5, Math.round(criterion.weight))),
        keywords: criterion.keywords,
      }));

    return { criteria };
  }

  /**
   * Check if the pool needs more questions for the given filters.
   * If so, and if allowed, generate them via AI.
   */
  async ensurePoolForFilters(
    filters: QuestionGenerationFilters,
    triggeredBy: string,
  ): Promise<boolean> {
    const poolSize = await this.getPoolSize(filters);
    if (poolSize >= AI_QUESTION_POOL_THRESHOLD) return false;

    const filterHash = this.computeFilterHash(filters);
    const recentGen = await this.prisma.questionGenerationLog.findFirst({
      where: {
        filterHash,
        createdAt: { gte: new Date(Date.now() - AI_GENERATION_COOLDOWN_MS) },
      },
    });
    if (recentGen) return false;

    if (triggeredBy !== "system") {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const userGenCount = await this.prisma.questionGenerationLog.count({
        where: { triggeredBy, createdAt: { gte: todayStart } },
      });
      if (userGenCount >= AI_MAX_USER_DAILY_GENERATIONS) return false;
    }

    return this.doGenerate(filters, triggeredBy);
  }

  /**
   * Urgent pool fill: bypasses cooldown but still enforces a short 5-minute
   * per-hash cooldown and a per-user daily cap to prevent bill-spiking attacks
   * where a user cycles through different tag combos.
   */
  async ensurePoolForFiltersUrgent(
    filters: QuestionGenerationFilters,
    triggeredBy = "system",
  ): Promise<boolean> {
    const poolSize = await this.getPoolSize(filters);
    if (poolSize >= AI_QUESTION_POOL_THRESHOLD) return false;

    const filterHash = this.computeFilterHash(filters);
    const recentGen = await this.prisma.questionGenerationLog.findFirst({
      where: {
        filterHash,
        createdAt: { gte: new Date(Date.now() - AI_URGENT_COOLDOWN_MS) },
      },
    });
    if (recentGen) return false;

    // Apply the same per-user daily cap as the normal path — prevents a free
    // user from cycling through unique tag combos to trigger unlimited AI calls.
    if (triggeredBy !== "system") {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const userGenCount = await this.prisma.questionGenerationLog.count({
        where: { triggeredBy, createdAt: { gte: todayStart } },
      });
      if (userGenCount >= AI_MAX_USER_DAILY_GENERATIONS) return false;
    }

    // Pass the actual triggeredBy (userId) so the generation log correctly
    // attributes this call — otherwise the daily cap is never decremented.
    return this.doGenerate(filters, triggeredBy);
  }

  /**
   * Shared generation logic used by both normal and urgent paths.
   */
  private async doGenerate(
    filters: QuestionGenerationFilters,
    triggeredBy: string,
  ): Promise<boolean> {
    const poolSize = await this.getPoolSize(filters);
    const filterHash = this.computeFilterHash(filters);

    const batchSize = Math.min(
      AI_QUESTION_BATCH_SIZE,
      AI_QUESTION_POOL_THRESHOLD + 3 - poolSize,
    );
    if (batchSize <= 0) return false;

    try {
      const questions = await this.generateQuestionBatch(filters, batchSize);

      if (questions.length === 0) return false;

      for (const q of questions) {
        await this.prisma.interviewQuestion.create({
          data: {
            track: q.track,
            tags: q.tags,
            difficulty: q.difficulty,
            type: q.type,
            level: q.level,
            prompt: q.prompt,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            correctOptionIndices: q.correctOptionIndices,
            multiSelect: q.multiSelect,
            expectedPoints: q.expectedPoints,
            redFlags: q.redFlags,
            rubric: q.rubric,
            modelAnswer: q.modelAnswer,
            followUpIds: q.followUpIds,
            source: "ai-generated",
            generatedForHash: filterHash,
          },
        });
      }

      await this.prisma.questionGenerationLog.create({
        data: {
          filterHash,
          filterCombo: this.toFilterComboJson(filters),
          questionsGenerated: questions.length,
          triggeredBy,
        },
      });

      this.logger.log(
        `Generated ${questions.length} questions for hash=${filterHash} triggered by ${triggeredBy}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`doGenerate failed for hash=${filterHash}`, error);
      return false;
    }
  }

  /**
   * Piggyback generation: called after a premium user finishes a session.
   * Always runs as "system" — does not charge the user's AI usage counter
   * and respects the normal per-hash cooldown.
   */
  async maybePiggybackGenerate(
    filters: QuestionGenerationFilters,
    userId: string,
  ): Promise<void> {
    if (Math.random() > AI_PIGGYBACK_CHANCE) return;
    try {
      // Pass "system" so no per-user daily cap or usage recording applies
      await this.ensurePoolForFilters(filters, "system");
    } catch (err) {
      this.logger.warn("Piggyback generation failed (non-critical)", err);
    }
  }

  /**
   * Background job: find the thinnest filter combos and fill them.
   * Called by a cron endpoint or scheduled task.
   */
  async backgroundFill(): Promise<{
    combosProcessed: number;
    questionsGenerated: number;
  }> {
    let callsMade = 0;
    let totalGenerated = 0;

    for (const filters of BACKGROUND_FILL_COMBOS) {
      if (callsMade >= AI_BACKGROUND_BUDGET) break;

      try {
        const poolSize = await this.getPoolSize(filters);
        if (poolSize < AI_QUESTION_POOL_THRESHOLD) {
          const generated = await this.ensurePoolForFilters(filters, "system");
          if (generated) {
            callsMade++;
            // Approximate: actual count logged inside doGenerate
            totalGenerated += AI_QUESTION_BATCH_SIZE;
          }
        }
      } catch (err) {
        this.logger.warn(
          `Background fill failed for ${filters.track}/${filters.level}/${filters.difficulty}`,
          err,
        );
      }
    }

    return { combosProcessed: callsMade, questionsGenerated: totalGenerated };
  }

  /**
   * Generate a batch of interview questions via OpenAI.
   */
  private async generateQuestionBatch(
    filters: QuestionGenerationFilters,
    count: number,
  ): Promise<GeneratedQuestion[]> {
    const difficultyNum = DIFFICULTY_MAP[filters.difficulty] ?? 3;
    const safeTags = sanitiseTags(filters.tags);
    const hasTags = safeTags.length > 0;
    const tagsStr = hasTags
      ? safeTags.join(", ")
      : `general ${filters.track} topics`;

    // When concrete tech tags are provided, restrict question types to ones
    // that actually test that technology. Generic system-design / behavioral
    // questions do not test TypeScript, React, etc. and must not be returned.
    const allowedTypes = hasTags
      ? `"theory", "coding", "debugging"`
      : `"theory", "coding", "debugging", "system-design", "behavioral", "ops"`;

    const topicInstruction = hasTags
      ? `Every single question MUST directly test the candidate's knowledge of: ${tagsStr}.
- The question prompt must explicitly reference or require knowledge of these specific technologies.
- Do NOT generate generic software-engineering questions (e.g. "Design a REST API", "Explain OOP") that could apply to any stack.
- A question about TypeScript must test TypeScript-specific concepts (type system, generics, utility types, decorators, tsconfig, etc.).
- A question about React must test React-specific concepts (hooks, reconciliation, lifecycle, JSX, context, etc.).`
      : `Generate questions covering general ${filters.track} topics.`;

    const systemPrompt = `You are an expert technical interviewer who creates high-quality multiple-choice interview questions for software developers.

You MUST return a valid JSON array of question objects. Each object has this EXACT shape:
{
  "prompt": "string — the question text",
  "options": ["string", "string", "string", "string"] — exactly 4 options,
  "correctOptionIndex": number (0-3),
  "multiSelect": false,
  "correctOptionIndices": [number] — array with just the correct index for single-select,
  "type": ${allowedTypes},
  "expectedPoints": ["string"] — 3-5 key points a good answer covers,
  "redFlags": ["string"] — 2-3 common misconceptions,
  "rubric": { "criteria": [{ "name": "string", "weight": number (1-5), "keywords": ["string"] }] } — 2-4 criteria,
  "modelAnswer": "string — a comprehensive 2-4 sentence correct answer explanation"
}

RULES:
- Generate exactly ${count} questions
- Track: ${filters.track}
- Level: ${filters.level} (junior = straightforward fundamentals, mid = applied knowledge + trade-offs, senior = architecture + deep expertise)
- Difficulty: ${difficultyNum}/5
- ${topicInstruction}
- Questions should feel like real interview questions from top tech companies
- Options should be plausible — avoid obviously wrong answers
- Each question must be unique and not a trivial variation of another
- Do NOT include any preamble, explanation, or code fences — return ONLY the JSON array`;

    const userPrompt = `Generate ${count} ${filters.level}-level ${filters.track} interview questions about ${tagsStr} at difficulty ${difficultyNum}/5.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.85,
        max_tokens: 4000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const raw = response.choices[0]?.message?.content?.trim() ?? "[]";
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      let parsed: unknown[];
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        this.logger.error(
          "Failed to parse AI question batch JSON",
          cleaned.slice(0, 200),
        );
        return [];
      }

      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter((q): q is ParsedGeneratedQuestion =>
          this.isParsedGeneratedQuestion(q),
        )
        .filter((q) => {
          // When specific tech tags were requested, reject any question whose
          // prompt or model answer doesn't mention at least one of those tags.
          // This catches hallucinated generic questions that slipped through.
          if (!hasTags) return true;
          const text = `${q.prompt} ${q.modelAnswer}`.toLowerCase();
          return safeTags.some((tag) => text.includes(tag.toLowerCase()));
        })
        .map((q): GeneratedQuestion => {
          const correctOptionIndex = Math.max(
            0,
            Math.min(3, Math.floor(q.correctOptionIndex)),
          );
          const correctOptionIndices = Array.isArray(q.correctOptionIndices)
            ? q.correctOptionIndices
                .map((index) => Math.floor(index))
                .filter((index) => index >= 0 && index < 4)
            : [correctOptionIndex];

          return {
            track: filters.track,
            tags:
              safeTags.length > 0
                ? safeTags.map((t) => t.toLowerCase())
                : [filters.track],
            difficulty: difficultyNum,
            type: q.type || "theory",
            level: filters.level,
            prompt: q.prompt,
            options: q.options.slice(0, 4),
            correctOptionIndex,
            correctOptionIndices:
              correctOptionIndices.length > 0
                ? correctOptionIndices
                : [correctOptionIndex],
            multiSelect: q.multiSelect ?? false,
            expectedPoints: Array.isArray(q.expectedPoints)
              ? q.expectedPoints.filter((item) => typeof item === "string")
              : [],
            redFlags: Array.isArray(q.redFlags)
              ? q.redFlags.filter((item) => typeof item === "string")
              : [],
            rubric: this.normalizeRubric(q.rubric),
            modelAnswer: q.modelAnswer,
            followUpIds: [],
          };
        });
    } catch (error) {
      this.logger.error("OpenAI question batch generation failed", error);
      return [];
    }
  }
}
