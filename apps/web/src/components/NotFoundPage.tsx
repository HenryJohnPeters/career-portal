import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import { useAuth } from "../lib/auth";

/** Unknown URL. Rendered inside the app shell for /app/* and full-page elsewhere. */
export function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const insideApp = pathname === "/app" || pathname.startsWith("/app/");
  const target = isAuthenticated ? "/app/dashboard" : "/";
  const Heading = insideApp ? "h2" : "h1";

  return (
    <div
      className={`flex flex-col items-center justify-center px-6 text-center ${
        insideApp ? "flex-1 py-20" : "min-h-screen bg-bg-primary"
      }`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 ring-1 ring-primary-200 dark:bg-primary-900/20 dark:ring-primary-800/50">
        <Compass className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">404</p>
      {/* Inside the shell the header already holds the page's h1. */}
      <Heading className="mt-1 text-2xl font-bold text-text-primary">Page not found</Heading>
      <p className="mt-2 max-w-md text-sm text-text-secondary">
        We couldn't find <span className="break-all font-mono text-text-primary">{pathname}</span>.
        It may have moved, or the link may be mistyped.
      </p>
      <Link
        to={target}
        className="mt-6 inline-flex h-9 items-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
      >
        {isAuthenticated ? "Back to dashboard" : "Go to the home page"}
      </Link>
    </div>
  );
}
