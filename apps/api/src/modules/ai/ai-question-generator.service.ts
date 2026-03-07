import { Injectable, Inject, Logger } from "@nestjs/common";
import OpenAI from "openai";
import * as crypto from "crypto";
import { PrismaService } from "../../common/prisma.service";
import { AiUsageService } from "./ai-usage.service";
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
    private readonly aiUsage: AiUsageService
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
    const where: Record<string, unknown> = {
      track: filters.track,
      level: filters.level,
    };

    const range = DIFFICULTY_RANGES[filters.difficulty];
    if (range) where.difficulty = range;

    if (filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags.map((t) => t.toLowerCase()) };
    }

    return this.prisma.interviewQuestion.count({ where: where as any });
  }

  /**
   * Check if the pool needs more questions for the given filters.
   * If so, and if allowed, generate them via AI.
   */
  async ensurePoolForFilters(
    filters: QuestionGenerationFilters,
    triggeredBy: string
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
   * Urgent pool fill: bypasses cooldown and per-user daily limits.
   * Still respects a short 5-minute cooldown to prevent runaway loops.
   */
  async ensurePoolForFiltersUrgent(
    filters: QuestionGenerationFilters
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

    return this.doGenerate(filters, "system");
  }

  /**
   * Shared generation logic used by both normal and urgent paths.
   */
  private async doGenerate(
    filters: QuestionGenerationFilters,
    triggeredBy: string
  ): Promise<boolean> {
    const poolSize = await this.getPoolSize(filters);
    const filterHash = this.computeFilterHash(filters);

    const batchSize = Math.min(
      AI_QUESTION_BATCH_SIZE,
      AI_QUESTION_POOL_THRESHOLD + 3 - poolSize
    );
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
        filterCombo: filters as any,
        questionsGenerated: questions.length,
        triggeredBy,
      },
    });

    if (triggeredBy !== "system") {
      await this.aiUsage.recordUsage(triggeredBy, "question-generation");
    }

    this.logger.log(
      `Generated ${questions.length} questions for hash=${filterHash} triggered by ${triggeredBy}`
    );
    return true;
  }

  /**
   * Piggyback generation: called after a premium user finishes a session.
   * Only triggers ~15% of the time to spread cost.
   */
  async maybePiggybackGenerate(
    filters: QuestionGenerationFilters,
    userId: string
  ): Promise<void> {
    if (Math.random() > AI_PIGGYBACK_CHANCE) return;
    try {
      await this.ensurePoolForFilters(filters, userId);
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

      const poolSize = await this.getPoolSize(filters);
      if (poolSize < AI_QUESTION_POOL_THRESHOLD) {
        const generated = await this.ensurePoolForFilters(filters, "system");
        if (generated) {
          callsMade++;
          totalGenerated += AI_QUESTION_BATCH_SIZE;
        }
      }
    }

    return { combosProcessed: callsMade, questionsGenerated: totalGenerated };
  }

  /**
   * Generate a batch of interview questions via OpenAI.
   */
  private async generateQuestionBatch(
    filters: QuestionGenerationFilters,
    count: number
  ): Promise<GeneratedQuestion[]> {
    const difficultyNum = DIFFICULTY_MAP[filters.difficulty] ?? 3;
    const tagsStr =
      filters.tags.length > 0
        ? filters.tags.join(", ")
        : `general ${filters.track} topics`;

    const systemPrompt = `You are an expert technical interviewer who creates high-quality multiple-choice interview questions for software developers.

You MUST return a valid JSON array of question objects. Each object has this EXACT shape:
{
  "prompt": "string — the question text",
  "options": ["string", "string", "string", "string"] — exactly 4 options,
  "correctOptionIndex": number (0-3),
  "multiSelect": false,
  "correctOptionIndices": [number] — array with just the correct index for single-select,
  "type": "theory" | "coding" | "debugging" | "system-design" | "behavioral" | "ops",
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
- Topics: ${tagsStr}
- Make questions diverse — mix theory, practical, debugging, and scenario-based
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
          cleaned.slice(0, 200)
        );
        return [];
      }

      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(
          (q): q is Record<string, unknown> =>
            typeof q === "object" &&
            q !== null &&
            typeof (q as any).prompt === "string" &&
            Array.isArray((q as any).options) &&
            (q as any).options.length >= 4 &&
            typeof (q as any).correctOptionIndex === "number" &&
            typeof (q as any).modelAnswer === "string"
        )
        .map((q) => ({
          track: filters.track,
          tags:
            filters.tags.length > 0
              ? filters.tags.map((t) => t.toLowerCase())
              : [filters.track],
          difficulty: difficultyNum,
          type: (q.type as string) || "theory",
          level: filters.level,
          prompt: q.prompt as string,
          options: (q.options as string[]).slice(0, 4),
          correctOptionIndex: q.correctOptionIndex as number,
          correctOptionIndices: (q.correctOptionIndices as number[]) ?? [
            q.correctOptionIndex as number,
          ],
          multiSelect: (q.multiSelect as boolean) ?? false,
          expectedPoints: (q.expectedPoints as string[]) ?? [],
          redFlags: (q.redFlags as string[]) ?? [],
          rubric: (q.rubric as GeneratedQuestion["rubric"]) ?? { criteria: [] },
          modelAnswer: q.modelAnswer as string,
          followUpIds: [],
        }));
    } catch (error) {
      this.logger.error("OpenAI question batch generation failed", error);
      return [];
    }
  }
}
