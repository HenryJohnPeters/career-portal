import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { FREE_TIER_MONTHLY_AI_LIMIT } from "../../common/constants";

export interface AiUsageStatus {
  used: number;
  limit: number | null; // null = unlimited (premium)
  remaining: number | null; // null = unlimited
  isPremium: boolean;
  resetsAt: string; // ISO date of next month start
}

@Injectable()
export class AiUsageService {
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
    const isPremium = user?.isPremium ?? false;
    const used = await this.getMonthlyUsageCount(userId);
    const limit = isPremium ? null : FREE_TIER_MONTHLY_AI_LIMIT;
    const remaining = isPremium
      ? null
      : Math.max(0, FREE_TIER_MONTHLY_AI_LIMIT - used);

    return {
      used,
      limit,
      remaining,
      isPremium,
      resetsAt: this.getNextMonthStart().toISOString(),
    };
  }

  /**
   * Check whether a user can perform an AI action.
   * Premium users always can; free users are capped.
   */
  async canUseAi(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.isPremium) return true;

    const used = await this.getMonthlyUsageCount(userId);
    return used < FREE_TIER_MONTHLY_AI_LIMIT;
  }

  /**
   * Record an AI usage event.
   */
  async recordUsage(userId: string, action: string): Promise<void> {
    await this.prisma.aiUsage.create({
      data: { userId, action },
    });
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
