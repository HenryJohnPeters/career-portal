import { Component, type CSSProperties, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "../lib/report-error";

interface AppErrorBoundaryState {
  error: Error | null;
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    textAlign: "center",
    fontFamily: "system-ui, sans-serif",
    background: "#0f172a",
    color: "#e2e8f0",
  },
  title: { fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" },
  text: { color: "#cbd5e1", marginBottom: "1.5rem", maxWidth: "420px" },
  details: { marginBottom: "1.5rem", textAlign: "left", maxWidth: "600px", width: "100%" },
  pre: {
    fontSize: "0.75rem",
    overflow: "auto",
    background: "#1e293b",
    padding: "1rem",
    borderRadius: "0.5rem",
    color: "#fca5a5",
  },
  actions: { display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" },
  button: {
    padding: "0.625rem 1.25rem",
    cursor: "pointer",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  link: { padding: "0.625rem 1.25rem", color: "#93c5fd", fontSize: "0.875rem" },
};

/**
 * Last-resort boundary around the whole app (outside the router, theme and
 * query providers), so it only uses inline styles and plain links.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { componentStack: info.componentStack, boundary: "app" });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div role="alert" style={styles.page}>
        <h1 style={styles.title}>Something went wrong</h1>
        <p style={styles.text}>
          An unexpected error occurred. Please reload the page. If the problem
          persists, contact support@career-repo.com.
        </p>
        {import.meta.env.DEV && (
          <details style={styles.details}>
            <summary style={{ cursor: "pointer", color: "#f87171", marginBottom: "0.5rem" }}>
              Error details (dev only)
            </summary>
            <pre style={styles.pre}>{error.stack}</pre>
          </details>
        )}
        <div style={styles.actions}>
          <button type="button" onClick={() => window.location.reload()} style={styles.button}>
            Reload page
          </button>
          <a href="/" style={styles.link}>
            Go to the home page
          </a>
        </div>
      </div>
    );
  }
}
