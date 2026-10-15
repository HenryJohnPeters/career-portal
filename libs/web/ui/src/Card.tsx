import type { KeyboardEvent, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  /** Makes the whole card a keyboard-accessible button. */
  onClick?: () => void;
  /** Accessible name when the card is clickable and its text is not descriptive enough. */
  "aria-label"?: string;
}

export function Card({
  children,
  className = "",
  hover = false,
  gradient = false,
  onClick,
  "aria-label": ariaLabel,
}: CardProps) {
  const interactive = Boolean(onClick);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={interactive ? onKeyDown : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      className={`
        bg-bg-elevated rounded-2xl border border-border
        shadow-sm transition-all duration-200
        ${hover || interactive ? "hover:shadow-md hover:-translate-y-px cursor-pointer" : ""}
        ${interactive ? "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" : ""}
        ${gradient ? "border-l-[3px] border-l-primary-500" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  variant?: "primary" | "success" | "warning" | "error" | "neutral";
  className?: string;
}

const BADGE_VARIANTS = {
  primary: "bg-primary-50 text-primary-700 ring-primary-200/60 dark:bg-primary-900/30 dark:text-primary-300 dark:ring-primary-700/40",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700/40",
  warning: "bg-amber-50 text-amber-700 ring-amber-200/60 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700/40",
  error: "bg-red-50 text-red-700 ring-red-200/60 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-700/40",
  neutral: "bg-neutral-100 text-neutral-600 ring-neutral-200/60 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700/40",
} as const;

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide ring-1 ${BADGE_VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  );
}
