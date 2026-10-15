import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Code2 } from "lucide-react";

const TONES = {
  primary: "bg-primary-600 text-white shadow-sm",
  success: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800/50",
  error: "bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800/50",
  info: "bg-primary-50 text-primary-600 ring-1 ring-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:ring-primary-800/50",
} as const;

interface AuthLayoutProps {
  title: string;
  subtitle?: ReactNode;
  /** Icon in a tile above the title. */
  icon?: ReactNode;
  iconTone?: keyof typeof TONES;
  /** Wrap the children in the elevated form card (default true). */
  card?: boolean;
  /** Under the card (e.g. "Already have an account?"). */
  footer?: ReactNode;
  children: ReactNode;
}

/** Shared shell for the sign-in, sign-up, password and email-link pages. */
export function AuthLayout({ title, subtitle, icon, iconTone = "primary", card = true, footer, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" aria-hidden="true" />

      <header className="relative z-10 h-14 flex items-center px-6 border-b border-border/50">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg hover:opacity-75 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
            <Code2 className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="text-sm font-bold tracking-tight text-text-primary">careerRepo</span>
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 sm:py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            {icon && (
              <div
                aria-hidden="true"
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-5 [&>svg]:h-5 [&>svg]:w-5 ${TONES[iconTone]}`}
              >
                {icon}
              </div>
            )}
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary mb-1.5">{title}</h1>
            {subtitle && <div className="text-sm text-text-secondary">{subtitle}</div>}
          </div>

          {card ? (
            <div className="bg-bg-elevated rounded-2xl border border-border shadow-lg p-6 sm:p-7">{children}</div>
          ) : (
            children
          )}

          {footer && <div className="mt-5 text-center text-xs text-text-secondary">{footer}</div>}
        </div>
      </main>

      <footer className="relative z-10 py-5 flex items-center justify-center gap-4 text-xs text-text-tertiary">
        <Link to="/privacy" className="hover:text-text-primary hover:underline">
          Privacy
        </Link>
        <Link to="/terms" className="hover:text-text-primary hover:underline">
          Terms
        </Link>
      </footer>
    </div>
  );
}

/** Text link styled for the auth pages. */
export const AUTH_LINK_CLASS =
  "font-semibold text-primary-700 dark:text-primary-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded";
