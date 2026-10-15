import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { DIFFICULTY_RANGES } from "../../common/constants";
import { PrismaService } from "../../common/prisma.service";
import { expandTagAliases } from "../../common/tech-tags";
import { AiQuestionGeneratorService } from "../ai/ai-question-generator.service";
import { selectQuestions, type CandidateQuestion } from "./engine";
import {
  MAX_POOL_CANDIDATES,
  MAX_RECENT_QUESTIONS,
  RECENT_QUESTION_WINDOW_MS,
} from "./interview-rules";

export interface PoolRequest {
  userId: string;
  isPremium: boolean;
  track: string;
  level: string;
  difficulty: string;
  /** Canonical catalog ids. */
  tags: string[];
  questionCount: number;
  roleFocus: string;
  interviewType: string;
}

export interface PoolPick {
  questionIds: string[];
  /**
   * Tags were requested but no bank question for the track/level/difficulty
   * has any of them: the session would be entirely off-topic, so it is not
   * created (and no quota is spent).
   */
  noTagMatch: boolean;
}

const CANDIDATE_SELECT = {
  id: true,
  type: true,
  difficulty: true,
  tags: true,
} as const satisfies Prisma.InterviewQuestionSelect;

/**
 * Picks the questions for a new session from the shared bank. Only light
 * columns are loaded for selection. When the tag-filtered pool is too small,
 * the session is topped up from the same track/level/difficulty without the
 * tag filter (questions sharing a tag still rank first); when no question
 * matches any requested tag, nothing is picked (see PoolPick.noTagMatch).
 * Only premium users can trigger AI generation, bounded by the generator's
 * own caps.
 */
@Injectable()
export class QuestionPoolService {
  private readonly logger = new Logger(QuestionPoolService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: AiQuestionGeneratorService,
  ) {}

  async pickQuestions(request: PoolRequest): Promise<PoolPick> {
    if (request.isPremium) await this.growPoolForPremium(request);

    const recent = await this.recentQuestionIds(request.userId);
    const settings = {
      level: request.level,
      difficulty: request.difficulty,
      tags: request.tags,
      questionCount: request.questionCount,
      roleFocus: request.roleFocus,
      interviewType: request.interviewType,
    };

    const tagged = await this.loadCandidates(request, request.tags);
    if (request.tags.length > 0 && tagged.length === 0) {
      return { questionIds: [], noTagMatch: true };
    }
    const picked = selectQuestions(tagged, settings, recent);
    if (picked.length >= request.questionCount || request.tags.length === 0) {
      return { questionIds: picked.map((q) => q.id), noTagMatch: false };
    }

    const pickedIds = new Set(picked.map((q) => q.id));
    const broader = (await this.loadCandidates(request, [])).filter((q) => !pickedIds.has(q.id));
    const topUp = selectQuestions(
      broader,
      { ...settings, questionCount: request.questionCount - picked.length },
      recent,
    );
    return { questionIds: [...picked, ...topUp].map((q) => q.id), noTagMatch: false };
  }

  /** Premium: one bounded generation when the requested pool is thinner than the session. */
  private async growPoolForPremium(request: PoolRequest): Promise<void> {
    const result = await this.generator.ensurePoolForUser(
      request.userId,
      {
        track: request.track,
        level: request.level,
        difficulty: request.difficulty,
        tags: request.tags,
      },
      request.questionCount,
    );
    if (result.generated > 0 || (result.skipped && result.skipped !== "pool_sufficient")) {
      this.logger.log(
        `Pool fill for ${request.track}/${request.level}/${request.difficulty} (${request.tags.length} tags): generated=${result.generated} skipped=${result.skipped ?? "none"}`,
      );
    }
  }

  private loadCandidates(request: PoolRequest, tags: readonly string[]): Promise<CandidateQuestion[]> {
    const where: Prisma.InterviewQuestionWhereInput = {
      track: request.track,
      level: request.level,
      difficulty: DIFFICULTY_RANGES[request.difficulty],
      ...(tags.length > 0 && { tags: { hasSome: expandTagAliases(tags) } }),
    };
    // Ordering by the random uuid id gives a stable, unbiased subset when the pool is huge.
    return this.prisma.interviewQuestion.findMany({
      where,
      select: CANDIDATE_SELECT,
      orderBy: { id: "asc" },
      take: MAX_POOL_CANDIDATES,
    });
  }

  /** Bank questions the user was served recently (any session status). */
  private async recentQuestionIds(userId: string): Promise<Set<string>> {
    const rows = await this.prisma.interviewSessionQuestion.findMany({
      where: {
        session: { userId },
        createdAt: { gte: new Date(Date.now() - RECENT_QUESTION_WINDOW_MS) },
      },
      select: { questionId: true },
      orderBy: { createdAt: "desc" },
      take: MAX_RECENT_QUESTIONS,
    });
    return new Set(rows.map((r) => r.questionId));
  }
}
