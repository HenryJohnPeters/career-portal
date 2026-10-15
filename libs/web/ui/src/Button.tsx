import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
}

const BASE =
  "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] select-none";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500 shadow-sm hover:shadow-md",
  secondary:
    "bg-neutral-100 text-neutral-800 hover:bg-neutral-200 focus-visible:ring-primary-500 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 shadow-sm",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm hover:shadow-md",
  ghost:
    "bg-transparent text-neutral-600 hover:bg-neutral-100 focus-visible:ring-primary-500 dark:text-neutral-300 dark:hover:bg-neutral-800/60",
  outline:
    "bg-transparent border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 focus-visible:ring-primary-500 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60 dark:hover:border-neutral-600",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 h-8",
  md: "px-4 py-2 text-sm gap-2 h-9",
  lg: "px-5 py-2.5 text-sm gap-2 h-10",
};

function LoadingGlyph() {
  return (
    <svg
      className="animate-spin h-3.5 w-3.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading,
    disabled,
    children,
    className = "",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoadingGlyph />}
      {children}
    </button>
  );
});

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> {
  /** Accessible name; also shown as the tooltip. Required: the button has no text. */
  label: string;
  children: ReactNode;
  size?: "sm" | "md";
}

/** A text-less button (icon only) that always has an accessible name. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { label, children, size = "md", className = "", type = "button", title, ...props },
    ref,
  ) {
    const padding = size === "sm" ? "p-1.5" : "p-2";
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={title ?? label}
        className={`inline-flex items-center justify-center rounded-lg ${padding} text-text-tertiary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);
