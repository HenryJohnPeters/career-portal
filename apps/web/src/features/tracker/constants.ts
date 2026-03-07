import {
  Star,
  Send,
  PhoneCall,
  Code2,
  Building2,
  Trophy,
  XCircle,
  Monitor,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PipelineStatus =
  | "wishlist"
  | "applied"
  | "phone_screen"
  | "technical_interview"
  | "onsite"
  | "tech_test"
  | "accepted"
  | "rejected";

export interface PipelineColumn {
  id: PipelineStatus;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  headerBg: string;
  dropBg: string;
}

export const PIPELINE_COLUMNS: PipelineColumn[] = [
  {
    id: "wishlist",
    label: "Wishlist",
    icon: Star,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    headerBg:
      "bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800/50",
    dropBg: "bg-purple-50/50 dark:bg-purple-900/10",
  },
  {
    id: "applied",
    label: "Applied",
    icon: Send,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    headerBg:
      "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50",
    dropBg: "bg-blue-50/50 dark:bg-blue-900/10",
  },
  {
    id: "phone_screen",
    label: "Phone Screen",
    icon: PhoneCall,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
    headerBg:
      "bg-cyan-100 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800/50",
    dropBg: "bg-cyan-50/50 dark:bg-cyan-900/10",
  },
  {
    id: "technical_interview",
    label: "Technical Interview",
    icon: Monitor,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    headerBg:
      "bg-sky-100 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800/50",
    dropBg: "bg-sky-50/50 dark:bg-sky-900/10",
  },
  {
    id: "onsite",
    label: "Onsite",
    icon: Building2,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    headerBg:
      "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800/50",
    dropBg: "bg-indigo-50/50 dark:bg-indigo-900/10",
  },
  {
    id: "tech_test",
    label: "Tech Test",
    icon: Code2,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    headerBg:
      "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50",
    dropBg: "bg-amber-50/50 dark:bg-amber-900/10",
  },
  {
    id: "accepted",
    label: "Accepted",
    icon: Trophy,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    headerBg:
      "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50",
    dropBg: "bg-emerald-50/50 dark:bg-emerald-900/10",
  },
  {
    id: "rejected",
    label: "Rejected",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    headerBg:
      "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800/50",
    dropBg: "bg-red-50/50 dark:bg-red-900/10",
  },
];

export type FollowUpBadge = "overdue" | "due" | "none";

export function getFollowUpBadge(followUpDate?: string | null): FollowUpBadge {
  if (!followUpDate) return "none";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(followUpDate);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return "overdue";
  if (diffDays <= 2) return "due";
  return "none";
}

export function getColumnForStatus(status: string): PipelineColumn {
  return (
    PIPELINE_COLUMNS.find((c) => c.id === status) || PIPELINE_COLUMNS[1] // default to "applied"
  );
}
