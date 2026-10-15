import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@careerportal/web/ui";
import { isChunkLoadError } from "../lib/lazy";
import { reportError } from "../lib/report-error";

interface RouteErrorBoundaryProps {
  children: ReactNode;
  /** Changing this (e.g. the pathname) clears the error, so navigating away recovers. */
  resetKey?: string;
  /** Where "Go back" leads. */
  homeHref?: string;
  homeLabel?: string;
  /** Fill the viewport (used outside the app shell). */
  fullScreen?: boolean;
}

interface RouteErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render errors of one route so the rest of the app (sidebar, header)
 * keeps working. A failed lazy chunk (new deploy) offers a reload instead.
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { componentStack: info.componentStack, boundary: "route" });
  }

  componentDidUpdate(prevProps: RouteErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private retry = () => {
    if (isChunkLoadError(this.state.error)) {
      window.location.reload();
      return;
    }
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { homeHref = "/app/dashboard", homeLabel = "Go to dashboard", fullScreen } = this.props;
    const staleChunk = isChunkLoadError(error);

    return (
      <div
        role="alert"
        className={`flex flex-col items-center justify-center px-6 text-center ${
          fullScreen ? "min-h-screen bg-bg-primary" : "flex-1 py-20"
        }`}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-200 dark:bg-red-900/20 dark:ring-red-800/50">
          <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary">
          {staleChunk ? "A new version is available" : "This page hit a problem"}
        </h2>
        <p className="mt-2 max-w-md text-sm text-text-secondary">
          {staleChunk
            ? "careerRepo was updated while this tab was open. Reload to continue."
            : "Something went wrong while showing this page. Your saved work is safe — try again, or head back."}
        </p>
        {import.meta.env.DEV && (
          <pre className="mt-4 max-w-xl overflow-auto rounded-lg bg-neutral-100 p-3 text-left text-xs text-red-600 dark:bg-neutral-900">
            {error.stack ?? error.message}
          </pre>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Button size="sm" onClick={this.retry}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {staleChunk ? "Reload" : "Try again"}
          </Button>
          <Link
            to={homeHref}
            className="inline-flex h-8 items-center rounded-xl px-3 text-xs font-semibold text-text-secondary hover:bg-neutral-100 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-white/5"
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    );
  }
}
