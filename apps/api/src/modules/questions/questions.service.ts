import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { AiQuestionGeneratorService } from "../ai/ai-question-generator.service";
import {
  FREE_DAILY_QUESTION_LIMIT,
  DIFFICULTY_RANGES,
  LEVEL_TO_DIFFICULTY,
} from "../../common/constants";

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiQuestionGenerator: AiQuestionGeneratorService
  ) {}

  async getQuestions(category?: string) {
    const where = category ? { category } : {};
    return this.prisma.question.findMany({
      where,
      include: { options: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async getAnswers(userId: string) {
    return this.prisma.questionAnswer.findMany({
      where: { userId },
      include: { question: true, selectedOption: true },
    });
  }

  async answerQuestion(
    userId: string,
    questionId: string,
    data: { answerText?: string; selectedOptionId?: string; skipped?: boolean }
  ) {
    return this.prisma.questionAnswer.upsert({
      where: { userId_questionId: { userId, questionId } },
      create: {
        userId,
        questionId,
        answerText: data.answerText,
        selectedOptionId: data.selectedOptionId,
        skipped: data.skipped ?? false,
      },
      update: {
        answerText: data.answerText,
        selectedOptionId: data.selectedOptionId,
        skipped: data.skipped ?? false,
      },
      include: { question: true, selectedOption: true },
    });
  }

  /**
   * Get how many practice questions a user has used today.
   */
  async getDailyUsageCount(userId: string): Promise<number> {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    return this.prisma.practiceQuestionUsage.count({
      where: { userId, createdAt: { gte: todayStart } },
    });
  }

  /**
   * Get practice usage status for a user.
   */
  async getPracticeUsageStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isPremium = user?.isPremium ?? false;
    const used = await this.getDailyUsageCount(userId);
    const limit = isPremium ? null : FREE_DAILY_QUESTION_LIMIT;
    const remaining = isPremium
      ? null
      : Math.max(0, FREE_DAILY_QUESTION_LIMIT - used);

    const tomorrow = new Date();
    tomorrow.setUTCHours(0, 0, 0, 0);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    return {
      used,
      limit,
      remaining,
      isPremium,
      resetsAt: tomorrow.toISOString(),
    };
  }

  /** Get a random practice question from the InterviewQuestion bank */
  async getRandomPracticeQuestion(
    userId: string,
    filters: {
      track?: string;
      level?: string;
      difficulty?: string;
      tags?: string[];
      excludeIds?: string[];
    }
  ) {
    // Check daily limit for free users
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isPremium = user?.isPremium ?? false;

    if (!isPremium) {
      const used = await this.getDailyUsageCount(userId);
      if (used >= FREE_DAILY_QUESTION_LIMIT) {
        throw new ForbiddenException(
          `You've reached your daily limit of ${FREE_DAILY_QUESTION_LIMIT} practice questions. Upgrade to Premium for unlimited practice.`
        );
      }
    }

    // ── Normalize inputs ──────────────────────────────────────────────
    const difficulty =
      filters.difficulty ||
      (filters.level ? LEVEL_TO_DIFFICULTY[filters.level] : undefined);

    const normalizedTags =
      filters.tags && filters.tags.length > 0
        ? filters.tags.map((t) => t.toLowerCase())
        : undefined;

    // ── Build the strictest "where" clause ─────────────────────────────
    const baseWhere: Record<string, unknown> = {};
    if (filters.track) baseWhere.track = filters.track;
    if (filters.level) baseWhere.level = filters.level;

    if (difficulty) {
      const range = DIFFICULTY_RANGES[difficulty];
      if (range) baseWhere.difficulty = range;
    }

    if (normalizedTags) {
      baseWhere.tags = { hasSome: normalizedTags };
    }

    if (filters.excludeIds && filters.excludeIds.length > 0) {
      baseWhere.id = { notIn: filters.excludeIds };
    }

    // ── Graduated fallback strategy ────────────────────────────────────
    const attempts: Record<string, unknown>[] = [baseWhere];

    if (baseWhere.id) {
      const noExclude = { ...baseWhere };
      delete noExclude.id;
      attempts.push(noExclude);
    }

    if (normalizedTags) {
      const noTags = { ...baseWhere };
      delete noTags.tags;
      delete noTags.id;
      attempts.push(noTags);
    }

    if (difficulty) {
      const noDiff: Record<string, unknown> = {};
      if (filters.track) noDiff.track = filters.track;
      if (filters.level) noDiff.level = filters.level;
      attempts.push(noDiff);
    }

    if (filters.track) {
      attempts.push({ track: filters.track });
    }

    let pickedQuestion: Awaited<
      ReturnType<typeof this.prisma.interviewQuestion.findFirst>
    > | null = null;

    for (const where of attempts) {
      const count = await this.prisma.interviewQuestion.count({
        where: where as any,
      });
      if (count > 0) {
        const skip = Math.floor(Math.random() * count);
        pickedQuestion = await this.prisma.interviewQuestion.findFirst({
          where: where as any,
          skip,
        });
        break;
      }
    }

    // ── If the pool is empty, try to generate questions on-demand ──────
    if (!pickedQuestion && filters.track && filters.level) {
      // Fix #3: Re-check daily limit before firing an expensive AI call.
      // This prevents AI from being triggered on a user's final free request.
      const canTriggerAi =
        isPremium ||
        (await this.getDailyUsageCount(userId)) < FREE_DAILY_QUESTION_LIMIT;

      if (canTriggerAi) {
        const genDifficulty = difficulty ?? "medium";
        try {
          // Fix #1: Pass userId instead of hardcoded "system" so the per-user
          // daily AI generation cap (AI_MAX_USER_DAILY_GENERATIONS) is enforced.
          const generated =
            await this.aiQuestionGenerator.ensurePoolForFiltersUrgent(
              {
                track: filters.track,
                level: filters.level,
                difficulty: genDifficulty,
                tags: normalizedTags ?? [],
              },
              userId
            );

          if (generated) {
            for (const where of attempts) {
              const count = await this.prisma.interviewQuestion.count({
                where: where as any,
              });
              if (count > 0) {
                const skip = Math.floor(Math.random() * count);
                pickedQuestion = await this.prisma.interviewQuestion.findFirst({
                  where: where as any,
                  skip,
                });
                break;
              }
            }
          }
        } catch {
          // Non-critical — if AI fails we still return null below
        }
      }
    }

    if (!pickedQuestion) return null;

    // ── Trigger AI back-fill when pool is thin ─────────────────────────
    if (isPremium && filters.track && filters.level && difficulty) {
      const strictCount = await this.prisma.interviewQuestion.count({
        where: baseWhere as any,
      });
      if (strictCount < 5) {
        this.aiQuestionGenerator
          .ensurePoolForFilters(
            {
              track: filters.track,
              level: filters.level,
              difficulty,
              tags: normalizedTags ?? [],
            },
            userId
          )
          .catch(() => {});
      }
    }

    // Record usage
    await this.prisma.practiceQuestionUsage.create({
      data: { userId, questionId: pickedQuestion.id },
    });

    return {
      id: pickedQuestion.id,
      prompt: pickedQuestion.prompt,
      options: pickedQuestion.options as string[],
      tags: pickedQuestion.tags,
      difficulty: pickedQuestion.difficulty,
      type: pickedQuestion.type,
      track: pickedQuestion.track,
      level: pickedQuestion.level,
      multiSelect: pickedQuestion.multiSelect ?? false,
    };
  }

  /** Check a practice answer and return the correct answer + explanation */
  async checkPracticeAnswer(
    questionId: string,
    selectedOptionIndex?: number,
    selectedOptionIndices?: number[]
  ) {
    const question: any = await this.prisma.interviewQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundException("Question not found");

    const options = question.options as string[];
    const isMultiSelect: boolean = question.multiSelect ?? false;

    if (isMultiSelect) {
      // Multi-select: compare sorted arrays
      const correctIndices: number[] = (
        (question.correctOptionIndices as number[]) ?? []
      ).sort((a: number, b: number) => a - b);
      const userIndices: number[] = [...(selectedOptionIndices ?? [])].sort(
        (a: number, b: number) => a - b
      );
      const isCorrect =
        correctIndices.length === userIndices.length &&
        correctIndices.every((v: number, i: number) => v === userIndices[i]);

      return {
        isCorrect,
        correctOptionIndex: correctIndices[0] ?? 0,
        correctOptionIndices: correctIndices,
        correctAnswer: correctIndices.map((i: number) => options[i]).join(", "),
        explanation: question.modelAnswer,
        questionId: question.id,
        multiSelect: true,
      };
    } else {
      // Single-select (original logic)
      const correctIdx = question.correctOptionIndex ?? 0;
      const isCorrect = selectedOptionIndex === correctIdx;

      return {
        isCorrect,
        correctOptionIndex: correctIdx,
        correctOptionIndices: [correctIdx],
        correctAnswer: options[correctIdx] ?? "",
        explanation: question.modelAnswer,
        questionId: question.id,
        multiSelect: false,
      };
    }
  }
}
