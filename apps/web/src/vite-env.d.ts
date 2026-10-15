/// <reference types="vite/client" />

/** Build-time variables, baked into the bundle (vite.config.ts checks them on `vite build`). */
interface ImportMetaEnv {
  /** API origin, e.g. https://api.career-repo.com (no trailing slash needed). */
  readonly VITE_API_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon (public) key — meant to ship to browsers; never the service-role key. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
