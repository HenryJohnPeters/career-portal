import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CvBuilderPage } from "./pages/CvBuilderPage";
import { CoverLettersPage } from "./pages/CoverLettersPage";
import { JobsPage } from "./pages/JobsPage";
import { InterviewPrepPage } from "./pages/InterviewPrepPage";
import { TechnicalTestsPage } from "./pages/TechnicalTestsPage";
import { BillingPage } from "./pages/BillingPage";
import { Spinner } from "@careerportal/web/ui";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <Spinner />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
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
        <Route path="billing" element={<BillingPage />} />
        <Route path="interview-prep" element={<InterviewPrepPage />} />
        <Route path="technical-tests" element={<TechnicalTestsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
