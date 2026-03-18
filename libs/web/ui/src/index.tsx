import React, { ReactNode, useEffect, useRef } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  title?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] select-none";
  const variants: Record<string, string> = {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md",
    secondary:
      "bg-neutral-100 text-neutral-800 hover:bg-neutral-200 focus:ring-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 shadow-sm",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md",
    ghost:
      "bg-transparent text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-300 dark:text-neutral-300 dark:hover:bg-neutral-800/60",
    outline:
      "bg-transparent border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 focus:ring-neutral-300 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60 dark:hover:border-neutral-600",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs gap-1.5 h-8",
    md: "px-4 py-2 text-sm gap-2 h-9",
    lg: "px-5 py-2.5 text-sm gap-2 h-10",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = "", hover = false, gradient = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-bg-elevated rounded-2xl border border-border
        shadow-sm transition-all duration-200
        ${hover ? "hover:shadow-md hover:-translate-y-px cursor-pointer" : ""}
        ${gradient ? "border-l-[3px] border-l-primary-500" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full bg-primary-500/10 animate-ping" />
        <svg className="animate-spin h-10 w-10 text-primary-500 relative" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 mb-4 ring-1 ring-border">
        <svg className="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20 mb-4 ring-1 ring-red-200 dark:ring-red-800/50">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-5">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* ── ConfirmDialog ─────────────────────────────────── */

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  variant: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, variant, onConfirm, onCancel }: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === overlayRef.current && onCancel()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl bg-bg-elevated shadow-xl border border-border animate-scale-in">
        <div className="p-6">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 rounded-lg p-1.5 text-text-tertiary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-4 mb-6">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              variant === "danger"
                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            }`}>
              {variant === "danger" ? <Trash2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-base font-semibold text-text-primary mb-1.5">{title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5">
            <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
            <Button variant={variant === "danger" ? "danger" : "primary"} size="sm" onClick={onConfirm}>
              {variant === "danger" ? "Delete" : "Confirm"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Badge ─────────────────────────────────── */

interface BadgeProps {
  children: ReactNode;
  variant?: "primary" | "success" | "warning" | "error" | "neutral";
  className?: string;
}

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  const variants = {
    primary: "bg-primary-50 text-primary-700 ring-primary-200/60 dark:bg-primary-900/30 dark:text-primary-300 dark:ring-primary-700/40",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700/40",
    warning: "bg-amber-50 text-amber-700 ring-amber-200/60 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700/40",
    error:   "bg-red-50 text-red-700 ring-red-200/60 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-700/40",
    neutral: "bg-neutral-100 text-neutral-600 ring-neutral-200/60 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700/40",
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide ring-1 ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
