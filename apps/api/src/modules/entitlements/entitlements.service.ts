import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { AI_USAGE_STATUS } from "../../common/constants";
import { PremiumRequiredException, type PremiumFeature } from "../../common/errors";
import {
  buildUsageMeter,
  getMonthWindow,
  getTrailingDayWindow,
  resolvePlan,
  type PlanUserFields,
} from "../../common/plan";
import type {
  AiUsageCounts,
  LegacyAiUsageStatus,
  PlanUsage,
  UserPlan,
} from "./entitlements.types";

const PLAN_USER_SELECT = {
  isPremium: true,
  stripeCurrentPeriodEnd: true,
  subscriptionStatus: true,
} as const satisfies Prisma.UserSelect;

/**
 * Single place that decides what a user's plan allows and how much of it they
 * have used. Global: inject it anywhere without importing the module.
 */
@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlan(userId: string): Promise<UserPlan> {
    const user = await this.findPlanUser(userId);
    return { userId, ...resolvePlan(user) };
  }

  /** Throws `PremiumRequiredException(feature)` unless the user has active premium. */
  async assertPremium(
    userId: string,
    feature: PremiumFeature,
  ): Promise<UserPlan> {
    const plan = await this.getPlan(userId);
    if (!plan.isPremium) throw new PremiumRequiredException(feature);
    return plan;
  }

  /**
   * AI usage counts for quota checks. Pass the transaction client when called
   * inside a `withUserLock` transaction so the counts see the locked state.
   */
  async countAiUsage(
    userId: string,
    client: Prisma.TransactionClient = this.prisma,
    now: Date = new Date(),
  ): Promise<AiUsageCounts> {
    const { start: monthStart } = getMonthWindow(now);
    const { start: dayStart } = getTrailingDayWindow(now);
    const [succeededThisMonth, succeededLast24h, attemptsLast24h] =
      await Promise.all([
        client.aiUsage.count({
          where: {
            userId,
            status: AI_USAGE_STATUS.succeeded,
            createdAt: { gte: monthStart },
          },
        }),
        client.aiUsage.count({
          where: {
            userId,
            status: AI_USAGE_STATUS.succeeded,
            createdAt: { gte: dayStart },
          },
        }),
        client.aiUsage.count({
          where: { userId, createdAt: { gte: dayStart } },
        }),
      ]);
    return { succeededThisMonth, succeededLast24h, attemptsLast24h };
  }

  async getPlanUsage(userId: string): Promise<PlanUsage> {
    const now = new Date();
    const { start, nextStart } = getMonthWindow(now);

    const [
      user,
      ai,
      mockSessions,
      questions,
      techTests,
      cvVersions,
      coverLetters,
    ] = await Promise.all([
      this.findPlanUser(userId),
      this.countAiUsage(userId, this.prisma, now),
      this.prisma.interviewSession.count({
        where: { userId, createdAt: { gte: start } },
      }),
      this.prisma.interviewSessionQuestion.count({
        where: { session: { userId }, answeredAt: { gte: start } },
      }),
      // Includes soft-deleted tests: deleting must not give quota back.
      this.prisma.technicalTest.count({
        where: { userId, createdAt: { gte: start } },
      }),
      this.prisma.cvVersion.count({ where: { userId } }),
      this.prisma.coverLetter.count({ where: { userId } }),
    ]);

    const { plan, isPremium, isTrialing, limits, modelTier } =
      resolvePlan(user);

    return {
      plan,
      isPremium,
      isTrialing,
      periodResetsAt: nextStart.toISOString(),
      meters: {
        aiActions: buildUsageMeter(
          ai.succeededThisMonth,
          limits.monthlyAiActions,
          nextStart,
        ),
        mockSessions: buildUsageMeter(
          mockSessions,
          limits.monthlyMockSessions,
          nextStart,
        ),
        questions: buildUsageMeter(
          questions,
          limits.monthlyQuestions,
          nextStart,
        ),
        techTests: buildUsageMeter(
          techTests,
          limits.monthlyTechTests,
          nextStart,
        ),
        cvVersions: buildUsageMeter(cvVersions, limits.cvVersions, null),
        coverLetters: buildUsageMeter(coverLetters, limits.coverLetters, null),
      },
      fairUse: limits.fairUse
        ? {
            aiActionsToday: ai.succeededLast24h,
            dailyLimit: limits.fairUse.dailyAiActions,
            aiActionsThisMonth: ai.succeededThisMonth,
            monthlyLimit: limits.fairUse.monthlyAiActions,
          }
        : null,
      features: {
        allTemplates: isPremium,
        allInterviewers: isPremium,
        tailorKit: isPremium,
        insights: isPremium,
        aiTechReview: isPremium,
        progressBreakdown: isPremium,
        aiModel: modelTier,
      },
    };
  }

  /** Legacy `GET /auth/ai-usage` payload, computed from the same counts. */
  async getLegacyAiUsageStatus(userId: string): Promise<LegacyAiUsageStatus> {
    return toLegacyAiUsageStatus(await this.getPlanUsage(userId));
  }

  private async findPlanUser(userId: string): Promise<PlanUserFields> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PLAN_USER_SELECT,
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }
}

export function toLegacyAiUsageStatus(usage: PlanUsage): LegacyAiUsageStatus {
  const { aiActions, mockSessions, questions, techTests } = usage.meters;
  return {
    used: aiActions.used,
    limit: aiActions.limit,
    remaining: aiActions.remaining,
    isPremium: usage.isPremium,
    resetsAt: usage.periodResetsAt,
    mockSessionsUsed: mockSessions.used,
    mockSessionsLimit: mockSessions.limit,
    mockSessionsRemaining: mockSessions.remaining,
    questionsUsed: questions.used,
    questionsLimit: questions.limit,
    questionsRemaining: questions.remaining,
    techTestsUsed: techTests.used,
    techTestsLimit: techTests.limit,
    techTestsRemaining: techTests.remaining,
  };
}
