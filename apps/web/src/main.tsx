import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import { App } from "./App";
import { ToastProvider } from "./features/tracker/components/Toast";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      throwOnError: false,
      staleTime: 30_000,
    },
  },
});

// Error boundary with clean production error page
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in all envs so developers can always diagnose.
    // In production this would feed a monitoring service (Sentry, etc.).
    console.error("Unhandled render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div
          style={{
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
          }}
        >
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "0.5rem",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: "#94a3b8",
              marginBottom: "1.5rem",
              maxWidth: "420px",
            }}
          >
            An unexpected error occurred. Please reload the page, and if the
            problem persists, contact support.
          </p>
          {isDev && this.state.error && (
            <details
              style={{
                marginBottom: "1.5rem",
                textAlign: "left",
                maxWidth: "600px",
                width: "100%",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  color: "#f87171",
                  marginBottom: "0.5rem",
                }}
              >
                Error details (dev only)
              </summary>
              <pre
                style={{
                  fontSize: "0.75rem",
                  overflow: "auto",
                  background: "#1e293b",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  color: "#fca5a5",
                }}
              >
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.625rem 1.25rem",
              cursor: "pointer",
              background: "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
