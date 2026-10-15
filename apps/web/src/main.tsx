import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter, useRouteError } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import { ToastProvider } from "./lib/toast";
import { createQueryClient } from "./lib/query-client";
import { installChunkErrorRecovery } from "./lib/lazy";
import { installGlobalErrorReporting } from "./lib/report-error";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { App } from "./App";
import "./index.css";

installChunkErrorRecovery();
installGlobalErrorReporting();

const queryClient = createQueryClient();

/** Hands render errors to AppErrorBoundary instead of the router's default error screen. */
function RethrowRouteError(): never {
  throw useRouteError();
}

/*
 * A data router (not <BrowserRouter>) so editors can hold a navigation with
 * useBlocker until their edits are saved. App keeps its own <Routes> under a
 * single catch-all route.
 */
const router = createBrowserRouter([{ path: "*", element: <App />, errorElement: <RethrowRouteError /> }], {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <RouterProvider router={router} future={{ v7_startTransition: true }} />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
