import { randomUUID } from "crypto";
import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { AI_USAGE_STATUS, type AiUsageStatusValue } from "../../common/constants";
import { lockedTransaction, userLockKey, type PlanLimits } from "../../common/plan";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { AiModelConfig } from "./ai-models";
import {
  evaluateAiQuota,
  normaliseUnits,
  tallyAiUsage,
  tallyWindowStart,
  toAiQuotaException,
  type AiUsageRow,
} from "./ai-quota";
import type {
  AiCallContext,
  AiReservation,
  AiReservationOptions,
  AiUsageStatus,
  AiUsageTelemetry,
} from "./ai.types";

/**
 * AI usage accounting. Every AI call takes a reservation: `pending` AiUsage
 * rows inserted under a per-user advisory lock after the quota checks, then
 * marked `succeeded` or `failed`. Rows are never deleted, so failed attempts
 * still count toward the daily attempt cap (see ai-quota.ts for the rules).
 */
@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly models: AiModelConfig,
  ) {}

  /** Legacy `GET /auth/ai-usage` payload. */
  getUsageStatus(userId: string): Promise<AiUsageStatus> {
    return this.entitlements.getLegacyAiUsageStatus(userId);
  }

  /**
   * Cheap, non-atomic check (no lock, no insert) so a request that would be
   * refused fails before validation and DB work. `reserve` stays authoritative.
   */
  async precheck(userId: string, units = 1): Promise<void> {
    const now = new Date();
    const [plan, rows] = await Promise.all([
      this.entitlements.getPlan(userId),
      this.loadRows(this.prisma, userId, now),
    ]);
    assertWithinQuota(rows, plan.limits, normaliseUnits(units), now);
  }

  /** Check every AI limit and insert `units` pending rows, atomically per user. */
  async reserve(
    userId: string,
    action: string,
    options: AiReservationOptions = {},
  ): Promise<AiReservation> {
    const units = normaliseUnits(options.units);
    const plan = await this.entitlements.getPlan(userId);
    const model = this.models.modelFor(plan.modelTier);

    const usageIds = await lockedTransaction(
      this.prisma,
      userLockKey("ai", userId),
      async (tx) => {
        const now = new Date();
        const rows = await this.loadRows(tx, userId, now);
        assertWithinQuota(rows, plan.limits, units, now);

        const ids = Array.from({ length: units }, () => randomUUID());
        await tx.aiUsage.createMany({
          data: ids.map((id) => ({
            id,
            userId,
            action,
            model,
            status: AI_USAGE_STATUS.pending,
          })),
        });
        return ids;
      },
    );

    return {
      usageIds,
      model,
      modelTier: plan.modelTier,
      isPremium: plan.isPremium,
    };
  }

  succeed(usageIds: string[], telemetry: AiUsageTelemetry = {}): Promise<void> {
    return this.settle(usageIds, AI_USAGE_STATUS.succeeded, telemetry);
  }

  fail(usageIds: string[], telemetry: AiUsageTelemetry = {}): Promise<void> {
    return this.settle(usageIds, AI_USAGE_STATUS.failed, telemetry);
  }

  /**
   * Reserve, run `work`, then mark the reservation succeeded or failed (and
   * rethrow). Never hold a DB transaction inside `work`.
   */
  async withReservation<T>(
    userId: string,
    action: string,
    work: (ctx: AiCallContext) => Promise<T>,
    options: AiReservationOptions = {},
  ): Promise<T> {
    const reservation = await this.reserve(userId, action, options);
    const tokens = { promptTokens: 0, completionTokens: 0 };
    let tokensRecorded = false;
    const ctx: AiCallContext = {
      model: reservation.model,
      modelTier: reservation.modelTier,
      isPremium: reservation.isPremium,
      recordTokens: (usage) => {
        tokensRecorded = true;
        tokens.promptTokens += usage.promptTokens;
        tokens.completionTokens += usage.completionTokens;
      },
    };
    const telemetry = (): AiUsageTelemetry => ({
      model: reservation.model,
      ...(tokensRecorded && tokens),
    });

    let result: T;
    try {
      result = await work(ctx);
    } catch (error) {
      await this.fail(reservation.usageIds, telemetry());
      throw error;
    }
    await this.succeed(reservation.usageIds, telemetry());
    return result;
  }

  private loadRows(
    client: Prisma.TransactionClient,
    userId: string,
    now: Date,
  ): Promise<AiUsageRow[]> {
    return client.aiUsage.findMany({
      where: { userId, createdAt: { gte: tallyWindowStart(now) } },
      select: { status: true, createdAt: true },
    });
  }

  /**
   * Token counts go on the first row (a multi-unit reservation is one logical
   * call). Errors are logged, not thrown: a row left pending stops counting
   * after PENDING_TTL_MS, and the caller's result must not be lost.
   */
  private async settle(
    usageIds: string[],
    status: AiUsageStatusValue,
    telemetry: AiUsageTelemetry,
  ): Promise<void> {
    const [first, ...rest] = usageIds;
    if (!first) return;
    const model = telemetry.model ? { model: telemetry.model } : {};
    try {
      await this.prisma.$transaction([
        this.prisma.aiUsage.updateMany({
          where: { id: first, status: AI_USAGE_STATUS.pending },
          data: {
            status,
            ...model,
            promptTokens: telemetry.promptTokens,
            completionTokens: telemetry.completionTokens,
          },
        }),
        ...(rest.length > 0
          ? [
              this.prisma.aiUsage.updateMany({
                where: { id: { in: rest }, status: AI_USAGE_STATUS.pending },
                data: { status, ...model },
              }),
            ]
          : []),
      ]);
    } catch (error) {
      const code = (error as { code?: unknown })?.code;
      this.logger.error(
        `Could not mark ${usageIds.length} AI usage row(s) ${status} (${typeof code === "string" ? code : "unknown error"})`,
      );
    }
  }
}

function assertWithinQuota(
  rows: readonly AiUsageRow[],
  limits: PlanLimits,
  units: number,
  now: Date,
): void {
  const verdict = evaluateAiQuota(tallyAiUsage(rows, now), limits, units, now);
  if (!verdict.ok) throw toAiQuotaException(verdict);
}
