/// <reference types="vite/client" />

/** Build-time variables, baked into the bundle (vite.config.ts checks them on `vite build`). */
interface ImportMetaEnv {
  /** API origin, e.g. https://api.career-repo.com (no trailing slash needed). */
  readonly VITE_API_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon (public) key — meant to ship to browsers; never the service-role key. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Optional: where unexpected client errors are POSTed as JSON (see lib/report-error.ts). */
  readonly VITE_ERROR_REPORT_URL?: string;
  /** Optional: release / commit id attached to error reports. */
  readonly VITE_RELEASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
