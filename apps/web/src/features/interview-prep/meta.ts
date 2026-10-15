import {
  Cloud,
  Gauge,
  Layers,
  Palette,
  Rocket,
  Server,
  Sprout,
  Star,
  type LucideIcon,
} from "lucide-react";
import type {
  InterviewDifficulty,
  InterviewLevel,
  InterviewRoleFocus,
  InterviewTrack,
} from "@careerportal/shared/types";

/*
 * Display metadata shared by interview prep and technical tests. Icons are
 * explicit lucide imports — never a namespace lookup, which ships every icon.
 */

export interface ChoiceMeta {
  label: string;
  description: string;
  icon: LucideIcon;
}

export const TRACKS: readonly InterviewTrack[] = ["frontend", "backend", "fullstack", "devops"];
export const LEVELS: readonly InterviewLevel[] = ["junior", "mid", "senior"];
export const ROLE_FOCUSES: readonly InterviewRoleFocus[] = ["frontend", "backend", "fullstack", "platform"];

export const TRACK_META: Readonly<Record<InterviewTrack, ChoiceMeta & { accent: string }>> = {
  frontend: { label: "Frontend", description: "HTML, CSS, JS, React & more", icon: Palette, accent: "bg-sky-500" },
  backend: { label: "Backend", description: "APIs, databases, servers", icon: Server, accent: "bg-emerald-600" },
  fullstack: { label: "Fullstack", description: "End-to-end development", icon: Layers, accent: "bg-violet-600" },
  devops: { label: "DevOps", description: "CI/CD, cloud, infrastructure", icon: Cloud, accent: "bg-orange-500" },
};

export const LEVEL_META: Readonly<Record<InterviewLevel, ChoiceMeta & { badge: string }>> = {
  junior: {
    label: "Junior",
    description: "Fundamentals & core concepts",
    icon: Sprout,
    badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  },
  mid: {
    label: "Mid-Level",
    description: "Patterns, architecture & trade-offs",
    icon: Rocket,
    badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  },
  senior: {
    label: "Senior",
    description: "System design & deep expertise",
    icon: Star,
    badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  },
};

export const ROLE_FOCUS_META: Readonly<Record<InterviewRoleFocus, ChoiceMeta>> = {
  frontend: { label: "Frontend", description: "UI frameworks, state, styling", icon: Palette },
  backend: { label: "Backend", description: "APIs, databases, services", icon: Server },
  fullstack: { label: "Fullstack", description: "End-to-end development", icon: Layers },
  platform: { label: "Platform / DevOps", description: "Cloud, CI/CD, infrastructure", icon: Cloud },
};

const DIFFICULTY_LABELS: Readonly<Record<InterviewDifficulty, string>> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/** Level → difficulty sent to the API. */
export const LEVEL_TO_DIFFICULTY: Readonly<Record<InterviewLevel, InterviewDifficulty>> = {
  junior: "easy",
  mid: "medium",
  senior: "hard",
};

function isKey<T extends string>(record: Readonly<Record<T, unknown>>, key: string): key is T {
  return Object.prototype.hasOwnProperty.call(record, key);
}

/** Metadata for a stored track value (unknown values fall back to a neutral entry). */
export function getTrackMeta(track: string): ChoiceMeta & { accent: string } {
  return isKey(TRACK_META, track)
    ? TRACK_META[track]
    : { label: track, description: "", icon: Layers, accent: "bg-neutral-500" };
}

export function getLevelMeta(level: string): ChoiceMeta & { badge: string } {
  return isKey(LEVEL_META, level)
    ? LEVEL_META[level]
    : { label: level, description: "", icon: Rocket, badge: "bg-neutral-100 dark:bg-neutral-800 text-text-secondary" };
}

export function getRoleFocusMeta(role: string): ChoiceMeta {
  return isKey(ROLE_FOCUS_META, role)
    ? ROLE_FOCUS_META[role]
    : { label: role, description: "", icon: Layers };
}

export function getDifficultyMeta(difficulty: string): { label: string; icon: LucideIcon } {
  return {
    label: isKey(DIFFICULTY_LABELS, difficulty) ? DIFFICULTY_LABELS[difficulty] : difficulty,
    icon: Gauge,
  };
}

export type ScoreTone = "good" | "fair" | "low";

/** ≥70 good, ≥40 fair, else low — one threshold for every score in the feature. */
export function scoreTone(percentage: number): ScoreTone {
  if (percentage >= 70) return "good";
  if (percentage >= 40) return "fair";
  return "low";
}

export const SCORE_TONE_TEXT: Readonly<Record<ScoreTone, string>> = {
  good: "text-emerald-600 dark:text-emerald-400",
  fair: "text-amber-600 dark:text-amber-400",
  low: "text-red-600 dark:text-red-400",
};

export const SCORE_TONE_BAR: Readonly<Record<ScoreTone, string>> = {
  good: "bg-emerald-500",
  fair: "bg-amber-500",
  low: "bg-red-400",
};

/** Clamp to 0-100 and round; non-finite values become 0. */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(100, Math.max(0, value)));
}

/** "15 Oct 2026" — dates in lists and headers. */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
