import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "./Button";

interface SpinnerProps {
  /** Announced to screen readers. */
  label?: string;
  className?: string;
}

export function Spinner({ label = "Loading", className = "py-16" }: SpinnerProps) {
  return (
    <div role="status" className={`flex justify-center items-center ${className}`}>
      <div className="relative h-10 w-10" aria-hidden="true">
        <div className="absolute inset-0 rounded-full bg-primary-500/10 animate-ping motion-reduce:animate-none" />
        <svg className="animate-spin h-10 w-10 text-primary-500 relative" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 mb-4 ring-1 ring-border">
        <svg className="h-6 w-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-sm font-medium text-text-secondary">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20 mb-4 ring-1 ring-red-200 dark:ring-red-800/50">
        <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-5 max-w-md">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export type AlertVariant = "error" | "warning" | "success" | "info";

const ALERT_STYLES: Record<AlertVariant, string> = {
  error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/60 dark:text-red-200",
  warning: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800/60 dark:text-amber-200",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/60 dark:text-emerald-200",
  info: "bg-primary-50 border-primary-200 text-primary-800 dark:bg-primary-900/20 dark:border-primary-800/60 dark:text-primary-200",
};

const ALERT_ICONS = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
} as const;

interface AlertProps {
  variant?: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  /** e.g. a retry or upgrade button, rendered under the text. */
  action?: ReactNode;
  className?: string;
  id?: string;
}

/** Inline message. Errors are announced immediately (role="alert"), the rest politely. */
export function Alert({ variant = "error", title, children, action, className = "", id }: AlertProps) {
  const Icon = ALERT_ICONS[variant];
  return (
    <div
      id={id}
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${ALERT_STYLES[variant]} ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
        {action && <div className="pt-1">{action}</div>}
      </div>
    </div>
  );
}
