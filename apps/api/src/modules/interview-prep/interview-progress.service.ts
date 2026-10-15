import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { EntitlementsService } from "../entitlements/entitlements.service";
import {
  buildProgress,
  progressWindowStart,
  trendWindowStart,
  type AnswerTally,
  type InterviewProgress,
  type WeekTally,
} from "./interview-progress";

/**
 * GET /interview-prep/progress: accuracy over the user's answers from the last
 * 12 months, aggregated in Postgres (grouped counts, never the answer rows).
 * An answer is correct when it scored full marks.
 */
@Injectable()
export class InterviewProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async getProgress(userId: string): Promise<InterviewProgress> {
    const now = new Date();
    const since = progressWindowStart(now);
    const plan = await this.entitlements.getPlan(userId);

    const [statusGroups, byType, byTag, byWeek] = await Promise.all([
      this.prisma.interviewSession.groupBy({
        by: ["status"],
        where: { userId, createdAt: { gte: since } },
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<AnswerTally[]>`
        SELECT q."type" AS "key",
               COUNT(*)::int AS "answered",
               COUNT(*) FILTER (WHERE sq."score" >= sq."maxScore")::int AS "correct"
        FROM "InterviewSessionQuestion" sq
        JOIN "InterviewSession" s ON s."id" = sq."sessionId"
        JOIN "InterviewQuestion" q ON q."id" = sq."questionId"
        WHERE s."userId" = ${userId} AND sq."answeredAt" >= ${since}
        GROUP BY q."type"`,
      this.prisma.$queryRaw<AnswerTally[]>`
        SELECT t."tag" AS "key",
               COUNT(*)::int AS "answered",
               COUNT(*) FILTER (WHERE sq."score" >= sq."maxScore")::int AS "correct"
        FROM "InterviewSessionQuestion" sq
        JOIN "InterviewSession" s ON s."id" = sq."sessionId"
        JOIN "InterviewQuestion" q ON q."id" = sq."questionId"
        CROSS JOIN LATERAL unnest(q."tags") AS t("tag")
        WHERE s."userId" = ${userId} AND sq."answeredAt" >= ${since}
        GROUP BY t."tag"`,
      plan.isPremium
        ? this.prisma.$queryRaw<WeekTally[]>`
            SELECT date_trunc('week', sq."answeredAt") AS "weekStart",
                   COUNT(*)::int AS "answered",
                   COUNT(*) FILTER (WHERE sq."score" >= sq."maxScore")::int AS "correct"
            FROM "InterviewSessionQuestion" sq
            JOIN "InterviewSession" s ON s."id" = sq."sessionId"
            WHERE s."userId" = ${userId} AND sq."answeredAt" >= ${trendWindowStart(now)}
            GROUP BY 1`
        : Promise.resolve([] as WeekTally[]),
    ]);

    const sessions = statusGroups.reduce((sum, g) => sum + g._count._all, 0);
    const completedSessions =
      statusGroups.find((g) => g.status === "completed")?._count._all ?? 0;

    return buildProgress({
      isPremium: plan.isPremium,
      sessions,
      completedSessions,
      byType,
      byTag,
      byWeek,
      now,
    });
  }
}
