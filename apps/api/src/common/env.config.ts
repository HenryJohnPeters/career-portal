import { z } from "zod";

/**
 * Typed environment configuration.
 * Validated at bootstrap via `validateEnv()`.
 */
const envSchema = z.object({
  // ── Database ──
  DATABASE_URL: z.string().min(1),

  // ── Supabase ──
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),

  // ── OpenAI ──
  OPENAI_API_KEY: z.string().min(1),

  // ── Stripe ──
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_PRICE_ID: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),

  // ── App ──
  CLIENT_URL: z.string().url().default("http://localhost:4200"),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // ── Admin ──
  ADMIN_API_KEY: z.string().min(1).optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate and return typed env vars.
 * Called once from `ConfigModule.forRoot()`.
 */
export function validateEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`❌ Invalid environment variables:\n${formatted}`);
  }
  return parsed.data;
}
