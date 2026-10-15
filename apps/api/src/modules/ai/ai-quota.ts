import { AI_USAGE_STATUS } from "../../common/constants";
import {
  CooldownException,
  FairUseLimitException,
  QuotaExceededException,
} from "../../common/errors";
import {
  DAY_MS,
  getMonthWindow,
  retryAfterForRollingWindow,
  secondsUntil,
  type PlanLimits,
} from "../../common/plan";

/*
 * AI quota math (PLAN §1.1), kept pure so it can be unit-tested.
 *
 * - "Counted" usage = succeeded rows, plus pending rows younger than
 *   PENDING_TTL_MS (in flight right now). Failed rows never count, so users
 *   are not charged for model or network failures.
 * - Free: counted this UTC month must stay within limits.monthlyAiActions.
 * - Premium: counted in the trailing 24h / this month must stay within the
 *   fair-use caps.
 * - Everyone: every attempt (any status) in the trailing 24h is capped, which
 *   bounds spend from repeated failures.
 * - Everyone: at most MAX_IN_FLIGHT_AI_CALLS concurrent calls.
 */

/** A pending reservation older than this is treated as abandoned (e.g. a crashed worker). */
export const PENDING_TTL_MS = 10 * 60 * 1000;

/** Max concurrent AI calls (fresh pending reservations) per user. */
export const MAX_IN_FLIGHT_AI_CALLS = 3;

/** Max usage units one reservation may take (the tailor kit takes 2). */
export const MAX_RESERVATION_UNITS = 3;

/** Retry hint when the in-flight limit is hit. */
const IN_FLIGHT_RETRY_SECONDS = 5;

export interface AiUsageRow {
  status: string;
  createdAt: Date;
}

export interface AiUsageTally {
  countedThisMonth: number;
  countedLast24h: number;
  oldestCountedLast24h: Date | null;
  attemptsLast24h: number;
  oldestAttemptLast24h: Date | null;
  inFlight: number;
}

/** Earliest `createdAt` the tally needs: the earlier of the month start and now - 24h. */
export function tallyWindowStart(now: Date): Date {
  const monthStart = getMonthWindow(now).start.getTime();
  return new Date(Math.min(monthStart, now.getTime() - DAY_MS));
}

export function tallyAiUsage(
  rows: readonly AiUsageRow[],
  now: Date,
): AiUsageTally {
  const monthStart = getMonthWindow(now).start.getTime();
  const dayStart = now.getTime() - DAY_MS;
  const pendingCutoff = now.getTime() - PENDING_TTL_MS;

  const tally: AiUsageTally = {
    countedThisMonth: 0,
    countedLast24h: 0,
    oldestCountedLast24h: null,
    attemptsLast24h: 0,
    oldestAttemptLast24h: null,
    inFlight: 0,
  };

  for (const row of rows) {
    const at = row.createdAt.getTime();
    const freshPending =
      row.status === AI_USAGE_STATUS.pending && at >= pendingCutoff;
    const counted = row.status === AI_USAGE_STATUS.succeeded || freshPending;

    if (freshPending) tally.inFlight++;
    if (counted && at >= monthStart) tally.countedThisMonth++;
    if (at >= dayStart) {
      tally.attemptsLast24h++;
      tally.oldestAttemptLast24h = earliest(tally.oldestAttemptLast24h, row.createdAt);
      if (counted) {
        tally.countedLast24h++;
        tally.oldestCountedLast24h = earliest(tally.oldestCountedLast24h, row.createdAt);
      }
    }
  }
  return tally;
}

export type AiQuotaVerdict =
  | { ok: true }
  | { ok: false; kind: "quota"; limit: number; used: number; resetsAt: Date }
  | { ok: false; kind: "fair_use_daily"; limit: number; retryAfterSeconds: number }
  | { ok: false; kind: "fair_use_monthly"; limit: number; retryAfterSeconds: number }
  | { ok: false; kind: "attempt_cap"; retryAfterSeconds: number }
  | { ok: false; kind: "in_flight"; retryAfterSeconds: number };

/** Can the user start `units` more AI actions now? Checks run most-actionable first. */
export function evaluateAiQuota(
  tally: AiUsageTally,
  limits: Pick<PlanLimits, "monthlyAiActions" | "fairUse" | "dailyAiAttemptCap">,
  units: number,
  now: Date,
): AiQuotaVerdict {
  const { nextStart } = getMonthWindow(now);

  const monthly = limits.monthlyAiActions;
  if (monthly !== null && tally.countedThisMonth + units > monthly) {
    return {
      ok: false,
      kind: "quota",
      limit: monthly,
      used: tally.countedThisMonth,
      resetsAt: nextStart,
    };
  }

  if (limits.fairUse) {
    const { dailyAiActions, monthlyAiActions } = limits.fairUse;
    if (tally.countedLast24h + units > dailyAiActions) {
      return {
        ok: false,
        kind: "fair_use_daily",
        limit: dailyAiActions,
        retryAfterSeconds: retryAfterForRollingWindow(
          tally.oldestCountedLast24h ?? now,
          DAY_MS,
          now,
        ),
      };
    }
    if (tally.countedThisMonth + units > monthlyAiActions) {
      return {
        ok: false,
        kind: "fair_use_monthly",
        limit: monthlyAiActions,
        retryAfterSeconds: secondsUntil(nextStart, now),
      };
    }
  }

  if (tally.attemptsLast24h + units > limits.dailyAiAttemptCap) {
    return {
      ok: false,
      kind: "attempt_cap",
      retryAfterSeconds: retryAfterForRollingWindow(
        tally.oldestAttemptLast24h ?? now,
        DAY_MS,
        now,
      ),
    };
  }

  if (tally.inFlight + units > MAX_IN_FLIGHT_AI_CALLS) {
    return {
      ok: false,
      kind: "in_flight",
      retryAfterSeconds: IN_FLIGHT_RETRY_SECONDS,
    };
  }

  return { ok: true };
}

/** The shared error-contract exception for a failed verdict (PLAN §2.1). */
export function toAiQuotaException(
  verdict: Exclude<AiQuotaVerdict, { ok: true }>,
): QuotaExceededException | FairUseLimitException | CooldownException {
  switch (verdict.kind) {
    case "quota":
      return new QuotaExceededException(
        "aiActions",
        verdict.limit,
        verdict.used,
        verdict.resetsAt,
      );
    case "fair_use_daily":
      return new FairUseLimitException(
        verdict.retryAfterSeconds,
        `You've reached the fair-use limit of ${verdict.limit} AI actions in 24 hours. Please try again later.`,
      );
    case "fair_use_monthly":
      return new FairUseLimitException(
        verdict.retryAfterSeconds,
        `You've reached the fair-use limit of ${verdict.limit} AI actions this month. It resets at the start of next month.`,
      );
    case "attempt_cap":
      return new FairUseLimitException(
        verdict.retryAfterSeconds,
        "Too many AI requests in the last 24 hours. Please try again later.",
      );
    case "in_flight":
      return new CooldownException(
        verdict.retryAfterSeconds,
        "Another AI request is still running. Please wait for it to finish.",
      );
  }
}

/** Clamp a requested unit count to 1..MAX_RESERVATION_UNITS (integers only). */
export function normaliseUnits(units: number | undefined): number {
  if (units === undefined || !Number.isFinite(units)) return 1;
  return Math.min(MAX_RESERVATION_UNITS, Math.max(1, Math.floor(units)));
}

function earliest(current: Date | null, candidate: Date): Date {
  return current === null || candidate < current ? candidate : current;
}
