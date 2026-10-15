import { z } from "zod";

/** Where the web app runs locally (`pnpm web`); the CLIENT_URL default outside production. */
const DEV_CLIENT_URL = "http://localhost:4200";
/** Extra CORS origins allowed outside production, for local web dev servers. */
export const DEV_CORS_ORIGINS: readonly string[] = [
  DEV_CLIENT_URL,
  "http://127.0.0.1:4200",
];

/** Blank values (common when a Railway variable is cleared) count as unset. */
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(
  blankToUndefined,
  z.string().trim().optional(),
);

/** An absolute http(s) URL. */
const httpUrl = z
  .string()
  .trim()
  .url()
  .transform((value) => new URL(value))
  .refine(
    (url) => url.protocol === "https:" || url.protocol === "http:",
    "must be an http(s) URL",
  );

/** Reduced to its origin, so a trailing slash or path can't break comparisons (CORS, redirects). */
const origin = httpUrl.transform((url) => url.origin);

/** Trailing slashes stripped, path kept (a self-hosted Supabase may live under one). */
const baseUrl = httpUrl
  .refine((url) => !url.search && !url.hash, "must not have a query or fragment")
  .transform((url) => `${url.origin}${url.pathname}`.replace(/\/+$/, ""));

const originList = z
  .string()
  .transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean))
  .pipe(z.array(origin));

const isLocalhost = (value: string) => {
  const { hostname } = new URL(value);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
};

/**
 * Typed environment. Validated once at boot by `validateEnv()` (ConfigModule);
 * read everywhere through `ConfigService<EnvConfig, true>`.
 */
const envSchema = z
  .object({
    // ── Database ──
    DATABASE_URL: z.string().min(1),

    // ── Supabase ──
    // SUPABASE_URL enables asymmetric (ES256/RS256) tokens via JWKS and the
    // issuer check; SUPABASE_JWT_SECRET enables legacy HS256 tokens. At least one.
    SUPABASE_URL: z.preprocess(blankToUndefined, baseUrl.optional()),
    SUPABASE_JWT_SECRET: optionalString,
    // Lets DELETE /account remove the Supabase auth user too (server-side only).
    SUPABASE_SERVICE_ROLE_KEY: optionalString,

    // ── OpenAI ──
    OPENAI_API_KEY: z.string().min(1),
    // Chat models that support JSON mode. Premium uses standard, free and background work light.
    OPENAI_MODEL_STANDARD: z.preprocess(blankToUndefined, z.string().trim().default("gpt-4o")),
    OPENAI_MODEL_LIGHT: z.preprocess(blankToUndefined, z.string().trim().default("gpt-4o-mini")),
    // Read by the OpenAI SDK itself (e.g. a staging proxy); validated here only.
    OPENAI_BASE_URL: z.preprocess(blankToUndefined, z.string().url().optional()),

    // ── Stripe ──
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_PRICE_ID: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    // Free-trial length for first-time subscribers; 0 disables trials.
    STRIPE_TRIAL_DAYS: z.preprocess(
      blankToUndefined,
      z.coerce.number().int().min(0).max(730).default(0),
    ),
    // Comma-separated extra price ids that also grant premium (old or annual prices).
    STRIPE_PREMIUM_PRICE_IDS: optionalString,

    // ── App ──
    // The web app's origin: CORS, Stripe redirects. Required (https) in production.
    CLIENT_URL: z.preprocess(blankToUndefined, origin.optional()),
    // Comma-separated extra web origins (e.g. the www and apex domains).
    CORS_ORIGINS: z.preprocess(blankToUndefined, originList.default("")),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    // Reverse proxies in front of the API (Railway's edge = 1). Sets Express
    // `trust proxy` so req.ip (rate limiting) is the real client, not the proxy.
    TRUST_PROXY_HOPS: z.preprocess(
      blankToUndefined,
      z.coerce.number().int().min(0).max(10).default(1),
    ),

    // ── Admin ──
    // Shared secret for POST /interview-prep/admin/background-fill (x-admin-key).
    ADMIN_API_KEY: z.preprocess(
      blankToUndefined,
      z
        .string()
        .min(32, "must be at least 32 characters (e.g. `openssl rand -hex 32`)")
        .optional(),
    ),
  })
  .superRefine((env, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

    if (!env.SUPABASE_URL && !env.SUPABASE_JWT_SECRET) {
      issue(
        "SUPABASE_URL",
        "set SUPABASE_URL (asymmetric JWT signing keys) and/or SUPABASE_JWT_SECRET (legacy HS256)",
      );
    }
    if (env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_URL) {
      issue("SUPABASE_URL", "is required when SUPABASE_SERVICE_ROLE_KEY is set");
    }

    if (env.NODE_ENV !== "production") return;
    if (!env.CLIENT_URL) {
      issue("CLIENT_URL", "is required in production (the web app's https origin)");
    } else if (!env.CLIENT_URL.startsWith("https://") || isLocalhost(env.CLIENT_URL)) {
      issue("CLIENT_URL", "must be a public https:// origin in production");
    }
    for (const extra of env.CORS_ORIGINS) {
      if (!extra.startsWith("https://")) {
        issue("CORS_ORIGINS", `${extra} must be https:// in production`);
      }
    }
    if (env.SUPABASE_URL && !env.SUPABASE_URL.startsWith("https://")) {
      issue("SUPABASE_URL", "must be https:// in production");
    }
    // Account deletion promises to remove the sign-in identity too.
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      issue(
        "SUPABASE_SERVICE_ROLE_KEY",
        "is required in production (account deletion must also delete the Supabase user)",
      );
    }
  })
  .transform((env) => ({ ...env, CLIENT_URL: env.CLIENT_URL ?? DEV_CLIENT_URL }));

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate and return typed env vars. ConfigModule passes the merged `.env`
 * file and process.env; called without arguments it reads process.env.
 */
export function validateEnv(
  config: Record<string, unknown> = process.env,
): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((i) => `  ${i.path.join(".") || "(env)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${formatted}`);
  }
  return parsed.data;
}

/** Browser origins allowed to call the API: CLIENT_URL, CORS_ORIGINS, and local dev servers outside production. */
export function corsAllowedOrigins(
  env: Pick<EnvConfig, "CLIENT_URL" | "CORS_ORIGINS" | "NODE_ENV">,
): ReadonlySet<string> {
  return new Set([
    env.CLIENT_URL,
    ...env.CORS_ORIGINS,
    ...(env.NODE_ENV === "production" ? [] : DEV_CORS_ORIGINS),
  ]);
}

/**
 * CORS decision for one request. Requests without an Origin header are
 * server-to-server (Stripe webhooks, health checks, cron) or same-origin:
 * they get no CORS headers but are never rejected, because the API
 * authenticates with bearer tokens, not cookies, so CORS is not a CSRF
 * defence here. Unknown origins also get no CORS headers (the browser blocks
 * the read) rather than an error response.
 */
export function isCorsOriginAllowed(
  requestOrigin: string | undefined,
  allowed: ReadonlySet<string>,
): boolean {
  return requestOrigin !== undefined && allowed.has(requestOrigin);
}
