import type { InterviewDifficulty } from "@careerportal/shared/types";

export interface TrackMeta {
  label: string;
  solid: string;
  solidText: string;
  bg: string;
  border: string;
  icon: string;
  description: string;
}

export interface LevelMeta {
  label: string;
  icon: string;
  description: string;
  color: string;
  solidBar: string;
}

export const TRACK_META: Record<string, TrackMeta> = {
  frontend: {
    label: "Frontend",
    solid: "bg-sky-500",
    solidText: "text-white",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-200 dark:border-sky-800",
    icon: "🎨",
    description: "HTML, CSS, JS, React & more",
  },
  backend: {
    label: "Backend",
    solid: "bg-emerald-600",
    solidText: "text-white",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "⚙️",
    description: "APIs, databases, servers",
  },
  fullstack: {
    label: "Fullstack",
    solid: "bg-violet-600",
    solidText: "text-white",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800",
    icon: "🔗",
    description: "End-to-end development",
  },
  devops: {
    label: "DevOps",
    solid: "bg-orange-500",
    solidText: "text-white",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    icon: "☁️",
    description: "CI/CD, cloud, infrastructure",
  },
};

export const LEVEL_META: Record<string, LevelMeta> = {
  junior: {
    label: "Junior",
    icon: "Sprout",
    description: "Fundamentals & core concepts",
    color: "text-emerald-600 dark:text-emerald-400",
    solidBar: "bg-emerald-500",
  },
  mid: {
    label: "Mid-Level",
    icon: "Rocket",
    description: "Patterns, architecture & tradeoffs",
    color: "text-amber-600 dark:text-amber-400",
    solidBar: "bg-amber-500",
  },
  senior: {
    label: "Senior",
    icon: "Star",
    description: "System design & deep expertise",
    color: "text-red-600 dark:text-red-400",
    solidBar: "bg-red-500",
  },
};

export const LEVEL_TO_DIFFICULTY: Record<string, InterviewDifficulty> = {
  junior: "easy",
  mid: "medium",
  senior: "hard",
};

export const LEVEL_BADGE_STYLES: Record<string, string> = {
  junior:
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  mid: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  senior: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

export const LEVEL_CHIP_STYLES: Record<string, string> = {
  junior:
    "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
  mid: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
  senior: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
};
