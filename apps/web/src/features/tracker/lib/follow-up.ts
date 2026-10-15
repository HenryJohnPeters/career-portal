import { appliedDateKey, localDateKey, toDateKey } from "../../../lib/follow-ups";
import { isClosedStatus } from "../constants";

/*
 * Follow-up dates are calendar dates ("YYYY-MM-DD"). The API stores them at
 * UTC midnight, so only the date part is read (toDateKey) and it is compared
 * with today's *local* date. Date arithmetic runs in UTC so DST changes can't
 * shift a day.
 */

export { appliedDateKey, localDateKey, toDateKey };

const DAY_MS = 86_400_000;
/** "Due soon" window, in days after today. */
const SOON_DAYS = 2;

function keyToUtcMs(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** The date `days` after `key` (negative goes back). */
export function addDaysToDateKey(key: string, days: number): string {
  return new Date(keyToUtcMs(key) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `fromKey` to `toKey` (negative when `toKey` is earlier). */
export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((keyToUtcMs(toKey) - keyToUtcMs(fromKey)) / DAY_MS);
}

/**
 * - `paused`: the application is closed (accepted/rejected), so no reminder.
 * - `overdue` / `today` / `soon` (within 2 days) / `later`, against today's local date.
 */
export type FollowUpState = "none" | "paused" | "overdue" | "today" | "soon" | "later";

export function getFollowUpState(
  followUpDate: string | null | undefined,
  status: string,
  today: string = localDateKey(),
): FollowUpState {
  const due = toDateKey(followUpDate);
  if (!due) return "none";
  if (isClosedStatus(status)) return "paused";
  const days = daysBetween(today, due);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= SOON_DAYS) return "soon";
  return "later";
}

/** True for follow-ups that need action now or soon (the tracker's "Follow-up due" filter). */
export function isFollowUpDue(state: FollowUpState): boolean {
  return state === "overdue" || state === "today" || state === "soon";
}

/** "Today", "Tomorrow", "In 3 days", "Yesterday", "4 days overdue". */
export function describeDueDate(dateKey: string, today: string = localDateKey()): string {
  const days = daysBetween(today, dateKey);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1) return `In ${days} days`;
  return `${-days} days overdue`;
}

const SHORT_DATE = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const SHORT_DATE_WITH_YEAR = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "22 Oct" (or "22 Oct 2027" outside the current year) for a "YYYY-MM-DD" key. */
export function formatDateKey(dateKey: string, today: string = localDateKey()): string {
  const date = new Date(keyToUtcMs(dateKey));
  return dateKey.slice(0, 4) === today.slice(0, 4)
    ? SHORT_DATE.format(date)
    : SHORT_DATE_WITH_YEAR.format(date);
}
