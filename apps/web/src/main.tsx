import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import { ToastProvider } from "./lib/toast";
import { createQueryClient } from "./lib/query-client";
import { installChunkErrorRecovery } from "./lib/lazy";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { App } from "./App";
import "./index.css";

installChunkErrorRecovery();

const queryClient = createQueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
