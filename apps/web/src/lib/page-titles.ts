export const BRAND = "careerRepo";

export const HOME_TITLE = `${BRAND} — CV builder, job tracker & interview practice`;

/** Header titles for the authenticated app (also used for document.title). */
export const APP_PAGE_TITLES: Readonly<Record<string, string>> = {
  "/app/dashboard": "Dashboard",
  "/app/cv": "CV Builder",
  "/app/cover-letters": "Cover Letters",
  "/app/jobs": "Job Tracker",
  "/app/practice": "Interview Practice",
  "/app/technical-tests": "Technical Tests",
  "/app/billing": "Billing & Plans",
  "/app/settings": "Settings",
};

const PUBLIC_PAGE_TITLES: Readonly<Record<string, string>> = {
  "/login": "Sign in",
  "/register": "Create your account",
  "/forgot-password": "Forgot password",
  "/reset-password": "Reset password",
  "/auth/callback": "Signing you in",
  "/privacy": "Privacy policy",
  "/terms": "Terms of service",
};

export const NOT_FOUND_TITLE = "Page not found";

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/** Header title for an /app route, or null when the route is unknown. */
export function getAppPageTitle(pathname: string): string | null {
  return APP_PAGE_TITLES[normalizePath(pathname)] ?? null;
}

export function getDocumentTitle(pathname: string): string {
  const path = normalizePath(pathname);
  if (path === "/") return HOME_TITLE;
  if (path === "/app") return BRAND; // redirects to the dashboard
  const title = APP_PAGE_TITLES[path] ?? PUBLIC_PAGE_TITLES[path] ?? NOT_FOUND_TITLE;
  return `${title} · ${BRAND}`;
}
