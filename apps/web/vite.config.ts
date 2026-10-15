import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * VITE_* values are baked into the bundle at build time, so a production
 * build without them would ship pointing at nothing (or at localhost) while
 * looking healthy. Fail the build instead. Set SKIP_WEB_ENV_CHECK=1 only for
 * throwaway local builds.
 */
function assertProductionEnv(env: Record<string, string>): void {
  const problems: string[] = [];
  const isSecureUrl = (value: string | undefined) => {
    if (!value) return false;
    try {
      const url = new URL(value);
      const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      return url.protocol === "https:" || (local && url.protocol === "http:");
    } catch {
      return false;
    }
  };

  if (!env.VITE_API_URL) problems.push("VITE_API_URL is not set");
  else if (!isSecureUrl(env.VITE_API_URL)) problems.push("VITE_API_URL must be an https:// URL");
  if (!env.VITE_SUPABASE_URL) problems.push("VITE_SUPABASE_URL is not set");
  else if (!isSecureUrl(env.VITE_SUPABASE_URL)) problems.push("VITE_SUPABASE_URL must be an https:// URL");
  if (!env.VITE_SUPABASE_ANON_KEY) problems.push("VITE_SUPABASE_ANON_KEY is not set");

  if (problems.length === 0) return;
  const message = `Web build environment is invalid:\n  - ${problems.join("\n  - ")}`;
  if (process.env.SKIP_WEB_ENV_CHECK === "1") {
    console.warn(`${message}\n(SKIP_WEB_ENV_CHECK=1: continuing with a build that cannot talk to the API.)`);
    return;
  }
  throw new Error(
    `${message}\nSet them in the build environment, or SKIP_WEB_ENV_CHECK=1 for a local test build.`,
  );
}

const nodeModule = (names: string) =>
  new RegExp(`[\\\\/]node_modules[\\\\/](?:${names})[\\\\/]`);

/** Long-lived vendor chunks: they change rarely, so they stay cached across deploys. */
const VENDOR_CHUNKS: [chunk: string, pattern: RegExp][] = [
  ["react", nodeModule("react|react-dom|scheduler|react-router|react-router-dom|@remix-run[\\\\/]router")],
  ["query", nodeModule("@tanstack[\\\\/][^\\\\/]+")],
  ["supabase", nodeModule("@supabase[\\\\/][^\\\\/]+")],
];

export default defineConfig(({ command, mode }) => {
  if (command === "build" && mode === "production") {
    assertProductionEnv(loadEnv(mode, __dirname, "VITE_"));
  }

  return {
    plugins: [react()],
    server: { port: 4200 },
    resolve: {
      alias: {
        "@careerportal/shared/types/cv-templates": path.resolve(
          __dirname,
          "../../libs/shared/types/src/cv-templates.ts",
        ),
        "@careerportal/shared/types": path.resolve(
          __dirname,
          "../../libs/shared/types/src/index.ts",
        ),
        "@careerportal/web/data-access": path.resolve(
          __dirname,
          "../../libs/web/data-access/src/index.ts",
        ),
        "@careerportal/web/ui": path.resolve(__dirname, "../../libs/web/ui/src/index.tsx"),
      },
      dedupe: ["@tanstack/react-query", "react", "react-dom"],
    },
    build: {
      target: "es2020",
      // No public source maps: there is no error-reporting service to upload them to.
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            for (const [chunk, pattern] of VENDOR_CHUNKS) {
              if (pattern.test(id)) return chunk;
            }
            return undefined;
          },
        },
      },
    },
    optimizeDeps: {
      include: ["@tanstack/react-query", "react", "react-dom"],
    },
  };
});
