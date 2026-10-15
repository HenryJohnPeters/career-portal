import { toPercentage } from "../../common/grade.util";
import { DAY_MS } from "../../common/plan";
import { findTechTag } from "../../common/tech-tags";

/** Progress covers this many weeks of trend (premium) … */
export const TREND_WEEKS = 12;
/** … and weak topics need at least this many answers on a tag. */
export const WEAK_TOPIC_MIN_ANSWERS = 3;
export const WEAK_TOPIC_LIMIT = 3;

const WEEK_MS = 7 * DAY_MS;

/** One aggregated row: answers and correct answers for a key (tag, type, week). */
export interface AnswerTally {
  key: string;
  answered: number;
  correct: number;
}

export interface WeekTally {
  weekStart: Date;
  answered: number;
  correct: number;
}

export interface ProgressInput {
  isPremium: boolean;
  sessions: number;
  completedSessions: number;
  byType: readonly AnswerTally[];
  byTag: readonly AnswerTally[];
  /** Premium only (empty for free). */
  byWeek: readonly WeekTally[];
  now: Date;
}

export interface TopicAccuracy {
  tag: string;
  answered: number;
  accuracy: number;
}

export interface InterviewProgress {
  totals: {
    sessions: number;
    completedSessions: number;
    answered: number;
    correct: number;
    accuracy: number | null;
  };
  weakTopics: TopicAccuracy[];
  byTag: { tag: string; answered: number; correct: number; accuracy: number }[] | null;
  byType: { type: string; answered: number; correct: number; accuracy: number }[] | null;
  weeklyTrend: { weekStart: string; answered: number; accuracy: number | null }[] | null;
  locked: boolean;
}

/** Start of the 12-month window progress is computed over. */
export function progressWindowStart(now: Date): Date {
  const start = new Date(now);
  start.setUTCFullYear(start.getUTCFullYear() - 1);
  return start;
}

/** Monday 00:00 UTC of the week containing `date` (matches Postgres date_trunc('week')). */
export function weekStartUtc(date: Date): Date {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const sinceMonday = (day.getUTCDay() + 6) % 7;
  return new Date(day.getTime() - sinceMonday * DAY_MS);
}

/** First week of the trend window. */
export function trendWindowStart(now: Date): Date {
  return new Date(weekStartUtc(now).getTime() - (TREND_WEEKS - 1) * WEEK_MS);
}

/**
 * Shapes aggregated answer counts into InterviewProgress. Free plans get the
 * totals and the top weak topics; the breakdowns and trend are premium
 * (`locked: true` and null otherwise). Stored tag spellings are mapped to
 * catalog ids; tags outside the catalog are ignored.
 */
export function buildProgress(input: ProgressInput): InterviewProgress {
  const answered = sum(input.byType, (r) => r.answered);
  const correct = Math.min(answered, sum(input.byType, (r) => r.correct));

  const tags = mergeTags(input.byTag).map((t) => ({
    tag: t.key,
    answered: t.answered,
    correct: t.correct,
    accuracy: toPercentage(t.correct, t.answered),
  }));
  const weakTopics = tags
    .filter((t) => t.answered >= WEAK_TOPIC_MIN_ANSWERS && t.accuracy < 100)
    .sort((a, b) => a.accuracy - b.accuracy || b.answered - a.answered || a.tag.localeCompare(b.tag))
    .slice(0, WEAK_TOPIC_LIMIT)
    .map(({ tag, answered: count, accuracy }) => ({ tag, answered: count, accuracy }));

  const totals = {
    sessions: input.sessions,
    completedSessions: input.completedSessions,
    answered,
    correct,
    accuracy: answered > 0 ? toPercentage(correct, answered) : null,
  };

  if (!input.isPremium) {
    return { totals, weakTopics, byTag: null, byType: null, weeklyTrend: null, locked: true };
  }

  return {
    totals,
    weakTopics,
    byTag: [...tags].sort((a, b) => b.answered - a.answered || a.tag.localeCompare(b.tag)),
    byType: input.byType
      .filter((r) => r.answered > 0)
      .map((r) => {
        const correctCount = Math.min(r.answered, Math.max(0, r.correct));
        return {
          type: r.key,
          answered: r.answered,
          correct: correctCount,
          accuracy: toPercentage(correctCount, r.answered),
        };
      })
      .sort((a, b) => b.answered - a.answered || a.type.localeCompare(b.type)),
    weeklyTrend: buildWeeklyTrend(input.byWeek, input.now),
    locked: false,
  };
}

/** TREND_WEEKS consecutive weeks, oldest first; weeks without answers are 0 / null. */
export function buildWeeklyTrend(
  rows: readonly WeekTally[],
  now: Date,
): { weekStart: string; answered: number; accuracy: number | null }[] {
  const byWeek = new Map<string, WeekTally>();
  for (const row of rows) {
    const key = isoDate(weekStartUtc(row.weekStart));
    const existing = byWeek.get(key);
    byWeek.set(key, {
      weekStart: row.weekStart,
      answered: (existing?.answered ?? 0) + row.answered,
      correct: (existing?.correct ?? 0) + row.correct,
    });
  }
  const first = trendWindowStart(now).getTime();
  return Array.from({ length: TREND_WEEKS }, (_, i) => {
    const weekStart = isoDate(new Date(first + i * WEEK_MS));
    const row = byWeek.get(weekStart);
    return {
      weekStart,
      answered: row?.answered ?? 0,
      accuracy: row && row.answered > 0 ? toPercentage(row.correct, row.answered) : null,
    };
  });
}

function mergeTags(rows: readonly AnswerTally[]): AnswerTally[] {
  const merged = new Map<string, AnswerTally>();
  for (const row of rows) {
    const tag = findTechTag(row.key);
    if (!tag || row.answered <= 0) continue;
    const existing = merged.get(tag.id) ?? { key: tag.id, answered: 0, correct: 0 };
    existing.answered += row.answered;
    existing.correct = Math.min(existing.answered, existing.correct + row.correct);
    merged.set(tag.id, existing);
  }
  return [...merged.values()];
}

function sum<T>(rows: readonly T[], pick: (row: T) => number): number {
  return rows.reduce((total, row) => total + Math.max(0, pick(row)), 0);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
