import { Suspense, useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { LandingPage } from "./pages/LandingPage";
import { NotFoundPage } from "./components/NotFoundPage";
import { PageLoader } from "./components/PageLoader";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import { UpgradeDialog } from "./components/UpgradeDialog";
import { lazyPage } from "./lib/lazy";
import { getDocumentTitle } from "./lib/page-titles";

// The landing page is the main entry point, so it ships in the initial bundle;
// every other page is its own chunk.
const LoginPage = lazyPage(() => import("./pages/LoginPage").then((m) => m.LoginPage));
const RegisterPage = lazyPage(() => import("./pages/RegisterPage").then((m) => m.RegisterPage));
const ForgotPasswordPage = lazyPage(() =>
  import("./pages/ForgotPasswordPage").then((m) => m.ForgotPasswordPage),
);
const ResetPasswordPage = lazyPage(() =>
  import("./pages/ResetPasswordPage").then((m) => m.ResetPasswordPage),
);
const AuthCallbackPage = lazyPage(() =>
  import("./pages/AuthCallbackPage").then((m) => m.AuthCallbackPage),
);
const PrivacyPage = lazyPage(() => import("./pages/PrivacyPage").then((m) => m.PrivacyPage));
const TermsPage = lazyPage(() => import("./pages/TermsPage").then((m) => m.TermsPage));

const DashboardPage = lazyPage(() => import("./pages/DashboardPage").then((m) => m.DashboardPage));
const CvBuilderPage = lazyPage(() => import("./pages/CvBuilderPage").then((m) => m.CvBuilderPage));
const CoverLettersPage = lazyPage(() =>
  import("./pages/CoverLettersPage").then((m) => m.CoverLettersPage),
);
const JobsPage = lazyPage(() => import("./pages/JobsPage").then((m) => m.JobsPage));
const InterviewPrepPage = lazyPage(() =>
  import("./pages/InterviewPrepPage").then((m) => m.InterviewPrepPage),
);
const TechnicalTestsPage = lazyPage(() =>
  import("./pages/TechnicalTestsPage").then((m) => m.TechnicalTestsPage),
);
const BillingPage = lazyPage(() => import("./pages/BillingPage").then((m) => m.BillingPage));
const SettingsPage = lazyPage(() => import("./pages/SettingsPage").then((m) => m.SettingsPage));

export function App() {
  const location = useLocation();

  // Layout effect so a page's own (passive) document.title effect can still override it.
  useLayoutEffect(() => {
    document.title = getDocumentTitle(location.pathname);
  }, [location.pathname]);

  return (
    <>
      <RouteErrorBoundary resetKey={location.pathname} homeHref="/" homeLabel="Go to the home page" fullScreen>
        <Suspense fallback={<PageLoader fullScreen />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="cv" element={<CvBuilderPage />} />
              <Route path="cover-letters" element={<CoverLettersPage />} />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="practice" element={<InterviewPrepPage />} />
              <Route path="technical-tests" element={<TechnicalTestsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
      <UpgradeDialog />
    </>
  );
}
