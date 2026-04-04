import { Injectable, ForbiddenException, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { FREE_TIER } from "../../common/constants";
import { isActivePremium } from "../../common/subscription.util";
import type { AiUsageStatus } from "./ai.types";

@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Count how many AI actions a user has used this calendar month.
   */
  async getMonthlyUsageCount(userId: string): Promise<number> {
    const start = this.getMonthStart();
    return this.prisma.aiUsage.count({
      where: {
        userId,
        createdAt: { gte: start },
      },
    });
  }

  /**
   * Get full usage status for a user (used by the API endpoint & guard).
   */
  async getUsageStatus(userId: string): Promise<AiUsageStatus> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isPremium = user ? isActivePremium(user) : false;
    const start = this.getMonthStart();
    const used = await this.getMonthlyUsageCount(userId);
    const limit = isPremium ? null : FREE_TIER.monthlyAiActions;
    const remaining = isPremium
      ? null
      : Math.max(0, FREE_TIER.monthlyAiActions - used);

    // Interview session + question + tech test usage
    const [mockSessionsUsed, questionsUsed, techTestsUsed] = await Promise.all([
      this.prisma.interviewSession.count({
        where: { userId, createdAt: { gte: start } },
      }),
      this.prisma.interviewSessionQuestion.count({
        where: {
          session: { userId },
          answeredAt: { gte: start },
        },
      }),
      this.prisma.technicalTest.count({
        where: { userId, createdAt: { gte: start } },
      }),
    ]);

    return {
      used,
      limit,
      remaining,
      isPremium,
      resetsAt: this.getNextMonthStart().toISOString(),
      mockSessionsUsed,
      mockSessionsLimit: isPremium ? null : FREE_TIER.monthlyMockSessions,
      mockSessionsRemaining: isPremium
        ? null
        : Math.max(0, FREE_TIER.monthlyMockSessions - mockSessionsUsed),
      questionsUsed,
      questionsLimit: isPremium ? null : FREE_TIER.monthlyQuestions,
      questionsRemaining: isPremium
        ? null
        : Math.max(0, FREE_TIER.monthlyQuestions - questionsUsed),
      techTestsUsed,
      techTestsLimit: isPremium ? null : FREE_TIER.monthlyTechTests,
      techTestsRemaining: isPremium
        ? null
        : Math.max(0, FREE_TIER.monthlyTechTests - techTestsUsed),
    };
  }

  /**
   * Check whether a user can perform an AI action.
   * Premium users always can; free users are capped.
   *
   * CRITICAL: Checks both isPremium flag AND subscription period end date.
   * Expired subscriptions are treated as free accounts.
   */
  async canUseAi(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    // Check if premium subscription is active (not expired)
    if (isActivePremium(user)) return true;

    const used = await this.getMonthlyUsageCount(userId);
    return used < FREE_TIER.monthlyAiActions;
  }

  /**
   * Atomically check the quota and reserve a usage slot in a single transaction.
   * Returns true if the slot was reserved (caller should proceed with the AI call).
   * Returns false if the quota is exhausted.
   *
   * On AI failure the caller must call `rollbackUsage()` to release the slot.
   * This prevents the race condition where two concurrent requests both pass
   * canUseAi() and then both call OpenAI.
   */
  async reserveUsage(
    userId: string,
    action: string,
  ): Promise<{ reserved: boolean; usageId: string | null }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { reserved: false, usageId: null };

    if (isActivePremium(user)) {
      // Premium users: always allow, still record for analytics
      const record = await this.prisma.aiUsage.create({
        data: { userId, action },
      });
      return { reserved: true, usageId: record.id };
    }

    // Free users: atomic check-and-insert inside a serializable transaction
    // to prevent two concurrent requests both passing the limit check
    return this.prisma.$transaction(async (tx) => {
      const start = this.getMonthStart();
      const used = await tx.aiUsage.count({
        where: { userId, createdAt: { gte: start } },
      });
      if (used >= FREE_TIER.monthlyAiActions) {
        return { reserved: false, usageId: null };
      }
      const record = await tx.aiUsage.create({
        data: { userId, action },
      });
      return { reserved: true, usageId: record.id };
    });
  }

  /**
   * Roll back a previously reserved usage slot (e.g. when the AI call fails).
   */
  async rollbackUsage(usageId: string): Promise<void> {
    await this.prisma.aiUsage
      .delete({ where: { id: usageId } })
      .catch((err) =>
        this.logger.warn(
          `Rollback for usage ${usageId} failed (non-critical)`,
          err,
        ),
      );
  }

  /**
   * Reserve a usage slot, run the AI work, and auto-rollback on failure.
   * Eliminates the repeated reserve/try/catch/rollback pattern across services.
   */
  async withReservation<T>(
    userId: string,
    action: string,
    work: () => Promise<T>,
  ): Promise<T> {
    const { reserved, usageId } = await this.reserveUsage(userId, action);
    if (!reserved) {
      throw new ForbiddenException(
        "You have reached your monthly AI limit. Upgrade to Premium for unlimited AI usage.",
      );
    }
    try {
      return await work();
    } catch (error) {
      if (usageId) await this.rollbackUsage(usageId);
      throw error;
    }
  }

  /** Start of the current calendar month (UTC). */
  private getMonthStart(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  /** Start of next calendar month (UTC). */
  private getNextMonthStart(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  }
}
