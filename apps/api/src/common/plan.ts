import type { Prisma, PrismaClient } from "@prisma/client";
import { AI_DAILY_ATTEMPT_CAP, FREE_TIER, PREMIUM_FAIR_USE } from "./constants";
import { isActivePremium } from "./subscription.util";

export const DAY_MS = 24 * 60 * 60 * 1000;

export type PlanName = "free" | "premium";
/** Free and background work use the light model; premium uses the standard one. */
export type ModelTier = "light" | "standard";

/** Limits for one plan. `null` = unlimited (premium). */
export interface PlanLimits {
  cvVersions: number | null;
  coverLetters: number | null;
  monthlyAiActions: number | null;
  monthlyMockSessions: number | null;
  monthlyQuestions: number | null;
  monthlyTechTests: number | null;
  interviewerCount: number | null;
  /** Template ids the plan may use; `null` = every template. */
  templateIds: readonly string[] | null;
  /** Premium "unlimited (fair use)" AI caps; `null` on free (the monthly quota applies). */
  fairUse: { monthlyAiActions: number; dailyAiActions: number } | null;
  /** Max AI attempts (any status) in a trailing 24h window. */
  dailyAiAttemptCap: number;
}

export interface UsageMeter {
  used: number;
  limit: number | null;
  remaining: number | null;
  resetsAt: string | null;
}

export interface MonthWindow {
  /** First instant of the current UTC month. */
  start: Date;
  /** First instant of the next UTC month (when monthly quotas reset). */
  nextStart: Date;
}

export interface TrailingDayWindow {
  /** `now - 24h`: count rows with `createdAt >= start`. */
  start: Date;
  end: Date;
}

/** The fields needed to resolve a user's plan. */
export interface PlanUserFields {
  isPremium: boolean;
  stripeCurrentPeriodEnd: Date | null;
  subscriptionStatus: string | null;
  /** A subscription set to cancel gets no renewal grace (see isActivePremium). */
  cancelAtPeriodEnd?: boolean;
}

export interface ResolvedPlan {
  plan: PlanName;
  isPremium: boolean;
  isTrialing: boolean;
  limits: PlanLimits;
  modelTier: ModelTier;
}

/** Monthly quotas reset at the start of each UTC calendar month. */
export function getMonthWindow(now: Date = new Date()): MonthWindow {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  return {
    start: new Date(Date.UTC(year, month, 1)),
    nextStart: new Date(Date.UTC(year, month + 1, 1)),
  };
}

/** Rolling 24h window used by the daily fair-use and attempt caps. */
export function getTrailingDayWindow(now: Date = new Date()): TrailingDayWindow {
  return { start: new Date(now.getTime() - DAY_MS), end: now };
}

/** Whole seconds (at least 1) until `target`; suitable for Retry-After. */
export function secondsUntil(target: Date, now: Date = new Date()): number {
  return Math.max(1, Math.ceil((target.getTime() - now.getTime()) / 1000));
}

/**
 * Retry-After for a rolling window: the slot frees up when the oldest counted
 * row in the window ages out.
 */
export function retryAfterForRollingWindow(
  oldestInWindow: Date,
  windowMs: number = DAY_MS,
  now: Date = new Date(),
): number {
  return secondsUntil(new Date(oldestInWindow.getTime() + windowMs), now);
}

export function limitsFor(isPremium: boolean): PlanLimits {
  if (isPremium) {
    return {
      cvVersions: null,
      coverLetters: null,
      monthlyAiActions: null,
      monthlyMockSessions: null,
      monthlyQuestions: null,
      monthlyTechTests: null,
      interviewerCount: null,
      templateIds: null,
      fairUse: {
        monthlyAiActions: PREMIUM_FAIR_USE.monthlyAiActions,
        dailyAiActions: PREMIUM_FAIR_USE.dailyAiActions,
      },
      dailyAiAttemptCap: AI_DAILY_ATTEMPT_CAP.premium,
    };
  }
  return {
    cvVersions: FREE_TIER.cvVersions,
    coverLetters: FREE_TIER.coverLetters,
    monthlyAiActions: FREE_TIER.monthlyAiActions,
    monthlyMockSessions: FREE_TIER.monthlyMockSessions,
    monthlyQuestions: FREE_TIER.monthlyQuestions,
    monthlyTechTests: FREE_TIER.monthlyTechTests,
    interviewerCount: FREE_TIER.interviewerCount,
    templateIds: FREE_TIER.templateIds,
    fairUse: null,
    dailyAiAttemptCap: AI_DAILY_ATTEMPT_CAP.free,
  };
}

export function modelTierFor(isPremium: boolean): ModelTier {
  return isPremium ? "standard" : "light";
}

/** Resolve the plan from an already-loaded user row (no DB access). */
export function resolvePlan(user: PlanUserFields): ResolvedPlan {
  const isPremium = isActivePremium(user);
  return {
    plan: isPremium ? "premium" : "free",
    isPremium,
    isTrialing: isPremium && user.subscriptionStatus === "trialing",
    limits: limitsFor(isPremium),
    modelTier: modelTierFor(isPremium),
  };
}

/** Builds a usage meter; `limit` null (unlimited) gives `remaining` null. */
export function buildUsageMeter(
  used: number,
  limit: number | null,
  resetsAt: Date | null,
): UsageMeter {
  return {
    used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - used),
    resetsAt: resetsAt ? resetsAt.toISOString() : null,
  };
}

/** Lock-key namespaces, so unrelated quotas for one user don't serialise. */
export type UserLockScope =
  | "ai"
  | "cv"
  | "cover-letter"
  | "job"
  | "interview"
  | "tech-test";

export function userLockKey(scope: UserLockScope, userId: string): string {
  return `${scope}:${userId}`;
}

/**
 * Serialise quota check-then-insert per user: takes a transaction-scoped
 * Postgres advisory lock, released automatically at commit/rollback.
 * Call it first inside a short interactive transaction (READ COMMITTED), then
 * count + insert. Never hold the transaction across an OpenAI/Stripe call.
 */
export async function withUserLock(
  tx: Prisma.TransactionClient,
  key: string,
): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}

/**
 * Options for locked quota transactions: `maxWait` bounds getting a pooled
 * connection, `timeout` bounds the whole transaction including the lock wait.
 */
export const USER_LOCK_TX_OPTIONS = { maxWait: 10_000, timeout: 15_000 } as const;

/** Run `fn` in a transaction that holds the per-user advisory lock `key`. */
export function lockedTransaction<T>(
  prisma: PrismaClient,
  key: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await withUserLock(tx, key);
    return fn(tx);
  }, USER_LOCK_TX_OPTIONS);
}
