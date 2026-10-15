import { BadRequestException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  TECH_TEST_RATINGS,
  type ScenarioCore,
  type StoredEvaluation,
  type TechTestRating,
  type TechTestSelfReview,
} from "./technical-tests.types";

/* ── Status machine: not_started → in_progress → submitted ────────── */

export const TEST_STATUS = {
  notStarted: "not_started",
  inProgress: "in_progress",
  submitted: "submitted",
  /** Legacy: never written any more, treated like "submitted". */
  evaluated: "evaluated",
} as const;

/** A solution can be submitted from these (submitting unstarted tests starts them). */
export const SUBMITTABLE_STATUSES: string[] = [TEST_STATUS.notStarted, TEST_STATUS.inProgress];

export function canSubmit(status: string): boolean {
  return SUBMITTABLE_STATUSES.includes(status);
}

/** Submitted (or legacy "evaluated"): reviews allowed, re-submits refused. */
export function isSubmitted(status: string): boolean {
  return status === TEST_STATUS.submitted || status === TEST_STATUS.evaluated;
}

/* ── Creation ─────────────────────────────────────────────────────── */

/** Share of premium tests that try an AI scenario even when a template fits. */
export const AI_SCENARIO_VARIETY_CHANCE = 0.25;

/**
 * AI scenarios are premium-only: tried when the template covers none of the
 * chosen tags, or occasionally for variety. `roll` is a number in [0, 1).
 */
export function shouldTryAiScenario(input: {
  isPremium: boolean;
  tagCount: number;
  tagMatches: number;
  roll: number;
}): boolean {
  if (!input.isPremium) return false;
  const weakMatch = input.tagCount > 0 && input.tagMatches === 0;
  return weakMatch || input.roll < AI_SCENARIO_VARIETY_CHANCE;
}

const MIN_SUGGESTED_MINUTES = 15;
const MAX_SUGGESTED_MINUTES = 12 * 60;
const ESTIMATE_PATTERN =
  /(\d+(?:\.\d+)?)\s*(?:(?:-|–|—|to)\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|h|minutes?|mins?|m)\b/i;

/**
 * Soft-timer length in minutes from an estimate such as "2–4 hours" (the
 * upper bound, so the timer only flags going past the estimate). 0 = no
 * suggestion when the estimate can't be read.
 */
export function suggestedMinutes(estimatedTime: string | null | undefined): number {
  const match = ESTIMATE_PATTERN.exec(estimatedTime ?? "");
  if (!match) return 0;
  const amount = Number(match[2] ?? match[1]);
  const minutes = /^h/i.test(match[3]) ? amount * 60 : amount;
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  return Math.min(MAX_SUGGESTED_MINUTES, Math.max(MIN_SUGGESTED_MINUTES, Math.round(minutes)));
}

/* ── Reviews ──────────────────────────────────────────────────────── */

export const MAX_SELF_REVIEW_NOTES = 5_000;
/** Upper bound on rubric size (templates have ≤6 criteria, AI scenarios ≤8). */
export const MAX_RUBRIC_CRITERIA = 20;

/**
 * Validates self-review ratings against the scenario's rubric and returns the
 * shape stored as `evaluation.selfReview` (ratings sorted by criterion).
 */
export function buildSelfReview(
  input: { ratings: readonly { criterionIndex: number; score: number }[]; notes?: string | null },
  criteriaCount: number,
  now: Date = new Date(),
): TechTestSelfReview {
  if (criteriaCount <= 0) {
    throw new BadRequestException("This test has no rubric to rate against.");
  }
  if (input.ratings.length === 0) {
    throw new BadRequestException("Rate at least one criterion.");
  }
  const seen = new Set<number>();
  const ratings: TechTestSelfReview["ratings"] = [];
  for (const { criterionIndex, score } of input.ratings) {
    if (!Number.isInteger(criterionIndex) || criterionIndex < 0 || criterionIndex >= criteriaCount) {
      throw new BadRequestException(
        `criterionIndex must be between 0 and ${criteriaCount - 1} for this test.`,
      );
    }
    if (seen.has(criterionIndex)) {
      throw new BadRequestException("Rate each criterion only once.");
    }
    if (!TECH_TEST_RATINGS.includes(score as TechTestRating)) {
      throw new BadRequestException("Each score must be 0, 1, 2 or 3.");
    }
    seen.add(criterionIndex);
    ratings.push({ criterionIndex, score: score as TechTestRating });
  }
  ratings.sort((a, b) => a.criterionIndex - b.criterionIndex);

  const notes = input.notes?.trim();
  if (notes && notes.length > MAX_SELF_REVIEW_NOTES) {
    throw new BadRequestException(`Notes must be at most ${MAX_SELF_REVIEW_NOTES} characters.`);
  }
  return { ratings, ...(notes ? { notes } : {}), reviewedAt: now.toISOString() };
}

/** An AI review claim older than this is treated as abandoned (the call times out at 90s). */
export const AI_REVIEW_CLAIM_TTL_MS = 5 * 60_000;

export type AiReviewState = "available" | "pending" | "done";

export function aiReviewState(
  evaluation: Pick<StoredEvaluation, "aiReview" | "aiReviewPendingSince"> | null,
  now: Date = new Date(),
): AiReviewState {
  if (evaluation?.aiReview) return "done";
  const since = Date.parse(evaluation?.aiReviewPendingSince ?? "");
  if (Number.isFinite(since) && now.getTime() - since < AI_REVIEW_CLAIM_TTL_MS) return "pending";
  return "available";
}

/* ── Reading stored JSON ──────────────────────────────────────────── */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The parts of a stored scenario the checklist and AI review rely on, or null if malformed. */
export function readScenario(value: Prisma.JsonValue | null): ScenarioCore | null {
  if (!isRecord(value)) return null;
  const { title, brief, requirements, evaluationCriteria } = value;
  if (typeof title !== "string" || typeof brief !== "string") return null;
  if (
    !Array.isArray(requirements) ||
    !requirements.every((r) => isRecord(r) && typeof r.key === "string" && typeof r.text === "string")
  ) {
    return null;
  }
  if (
    !Array.isArray(evaluationCriteria) ||
    !evaluationCriteria.every(
      (c) =>
        isRecord(c) &&
        typeof c.name === "string" &&
        typeof c.weight === "number" &&
        (c.description === undefined || typeof c.description === "string"),
    )
  ) {
    return null;
  }
  return {
    title,
    brief,
    requirements: requirements as ScenarioCore["requirements"],
    evaluationCriteria: evaluationCriteria as ScenarioCore["evaluationCriteria"],
  };
}

/** A stored checklist evaluation (with any reviews), or null when absent or legacy-malformed. */
export function readEvaluation(value: Prisma.JsonValue | null): StoredEvaluation | null {
  if (!isRecord(value) || typeof value.percentage !== "number") return null;
  return value as unknown as StoredEvaluation;
}

/** Plain JSON for a Prisma Json column (drops undefined fields). */
export function toJson(value: object): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
}
