# Deployment

careerRepo runs on [Railway](https://railway.app) as two services plus a database:

| Piece | Built from | Config | Serves |
|---|---|---|---|
| `api` service | `Dockerfile.api` (Node 22, Chromium headless shell for PDFs, runs as non-root under `tini`) | `railway.api.json` | NestJS API |
| `web` service | Nixpacks (`nixpacks.toml`), Vite build | `railway.json` | `server.js`: the SPA with security headers and caching |
| Postgres | Railway Postgres plugin | | |

External services: Supabase (sign-in), Stripe (payments), OpenAI (AI features).

On every API deploy Railway runs `prisma migrate deploy` (the `preDeployCommand`) before the new
container takes traffic, and only switches traffic once `GET /health` (which checks the database)
answers 200. A failed migration or health check leaves the previous deployment serving.

## 1. First-time setup

1. Create a Railway project and add the **Postgres** plugin.
2. Add a service named **`api`** from the GitHub repo:
   - Settings → Config-as-code: `railway.api.json` (root directory: repository root).
   - Variables: see [API variables](#api-service). Use the Raw Editor; never put secrets in files.
   - Networking: generate a domain (or attach `api.your-domain.com`).
3. Add a service named **`web`** from the same repo:
   - Config-as-code: `railway.json`.
   - Variables: see [web variables](#web-service). They are needed at build time.
   - Networking: attach your public domain.
4. Set `CLIENT_URL` on `api` to the web origin (e.g. `https://your-domain.com`), and
   `VITE_API_URL` on `web` to the API origin. Redeploy both.
5. Seed the interview question bank once (see [Migrations and seed data](#migrations-and-seed-data)).
6. Configure Supabase and Stripe (sections below), then run the [post-deploy check](#verify-a-deploy).

Each service's `watchPatterns` limit rebuilds to the files it uses, so a web-only change does not
redeploy the API.

## 2. Environment variables

The API validates its environment at boot (`apps/api/src/common/env.config.ts`) and refuses to
start, naming each missing or malformed variable, rather than failing later. `.env.example` lists
everything with comments.

### API service

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Reference the plugin: `${{Postgres.DATABASE_URL}}`. Prisma's pool defaults to `cpus * 2 + 1`; on small instances append `?connection_limit=10` (the dashboard runs its summary queries in parallel). |
| `SUPABASE_URL` | one of these two | Project URL. Verifies ES256/RS256 tokens via the project's JWKS and checks the issuer. |
| `SUPABASE_JWT_SECRET` | one of these two | Legacy HS256 secret; only if the project still signs tokens with it. |
| `SUPABASE_SERVICE_ROLE_KEY` | no | Lets account deletion also delete the Supabase user. Server-side only. Needs `SUPABASE_URL`. |
| `OPENAI_API_KEY` | yes | |
| `OPENAI_MODEL_STANDARD` / `OPENAI_MODEL_LIGHT` | no | Default `gpt-4o` (premium) / `gpt-4o-mini` (free and background). Chat models with JSON mode. |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` | yes | Live values in production. |
| `STRIPE_TRIAL_DAYS` | no | Free-trial days for first-time subscribers; `0` (default) disables trials. |
| `STRIPE_PREMIUM_PRICE_IDS` | no | Extra comma-separated price ids that also grant premium (old or annual prices). `STRIPE_PRICE_ID` stays the checkout price. |
| `CLIENT_URL` | yes (production) | Public `https://` origin of the web app. CORS and Stripe redirects use it. |
| `CORS_ORIGINS` | no | More web origins, comma-separated (e.g. both `https://www.` and apex). |
| `NODE_ENV` | yes | `production` (the image sets it). Swagger (`/docs`) only exists outside production. |
| `TRUST_PROXY_HOPS` | no | Proxies in front of the API. `1` (default) on Railway; `2` with Cloudflare proxying in front. Rate limits key on the client IP this yields. |
| `ADMIN_API_KEY` | no | 32+ characters (`openssl rand -hex 32`). Enables `POST /interview-prep/admin/background-fill`. |
| `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` | recommended | e.g. `60`: on redeploy the old container stops taking connections and finishes in-flight requests (AI generations can take up to 90 s) before it is stopped. |

`PORT` is provided by Railway.

### Web service

`VITE_API_URL`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are compiled into the bundle, so
they are public: never put a secret in a `VITE_` variable. The production build fails if any is
missing or not `https://`. `server.js` also reads the first two at runtime to build its
Content-Security-Policy `connect-src`.

## 3. Supabase

- **Authentication → URL configuration**: Site URL = `CLIENT_URL`; add `CLIENT_URL/auth/callback**` to
  the redirect URLs (the wildcard matters: the app appends `?type=recovery`, `?intent=premium` and
  `?next=/app/...` to the callback).
- **Authentication → Providers → Email**: keep "Confirm email" on; enable **Secure email change**
  and **Secure password change** (re-authentication for password updates), set the minimum password
  length to at least 8 and turn on leaked-password protection.
- **JWT signing keys**: with asymmetric keys (recommended) set `SUPABASE_URL`; the API fetches and
  caches the public keys (cached for an hour, unknown key ids refetched at most every 30 s). After
  *revoking* a key, redeploy the API to drop it from the cache at once. Legacy HS256 projects set
  `SUPABASE_JWT_SECRET` instead (or as well, during a migration).
- **Anonymous sign-ins** stay disabled; the API rejects anonymous and email-less tokens anyway.
- `SUPABASE_SERVICE_ROLE_KEY` (optional) goes on the API service only. Without it, deleting an
  account removes all app data but the Supabase login survives, and signing in again starts a new,
  empty account.

## 4. Stripe go-live checklist

1. Live `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` on the API.
2. **Webhook endpoint** `https://<api-domain>/billing/webhook` with these events:
   `checkout.session.completed`, `checkout.session.expired`,
   `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`,
   `customer.subscription.paused`, `customer.subscription.resumed`,
   `invoice.paid`, `invoice.payment_failed`, `customer.deleted`, `charge.dispute.created`.
   (`invoice.payment_succeeded` is not needed.) Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
3. **Customer Portal**: save the live configuration with payment-method updates and cancellation
   enabled (the portal does not work in live mode until it is saved).
4. Optional: `STRIPE_TRIAL_DAYS`, `STRIPE_PREMIUM_PRICE_IDS`; in the Dashboard, "limit customers to
   one subscription" and the trial-reminder emails.
5. Test-mode customer ids left in a live database are detected and replaced on the user's next
   checkout or portal visit, but clearing them before launch is cleaner:
   `UPDATE "User" SET "stripeCustomerId" = NULL, "stripeSubscriptionId" = NULL, "stripePriceId" = NULL, "stripeCheckoutSessionId" = NULL, "stripeCheckoutSessionExpiresAt" = NULL, "isPremium" = false, "subscriptionStatus" = NULL, "stripeCurrentPeriodEnd" = NULL;`

The webhook is authenticated by its signature, is never rate-limited, and does not need an `Origin`
header. Non-2xx responses are deliberate: `409` while the same event is still being processed and
`5xx` when processing failed both make Stripe retry.

## 5. Migrations and seed data

- Production migrations run automatically (`railway.api.json` → `preDeployCommand`):
  `node apps/api/node_modules/prisma/build/index.js migrate deploy --schema apps/api/prisma/schema.prisma`.
  Prisma takes a lock, so concurrent deploys are safe. Migrations are forward-only.
- A database created earlier with `prisma db push` fails the first `migrate deploy` with `P3005`.
  Baseline it once: `prisma migrate resolve --applied <migration>` for each existing migration.
- New migrations are created locally with `pnpm db:migrate` and committed.
- **Question bank**: seed it once (and after changing seeded questions), from a machine with the
  repo, against the production database (Railway Postgres → Connect → public URL):
  `DATABASE_URL="<public url>" NODE_ENV=production pnpm db:seed`.
  With `NODE_ENV=production` the seed loads reference data only and skips the dev accounts.

## 6. Health checks and operations

| Endpoint | Service | Meaning |
|---|---|---|
| `GET /health` | api | `{ "status": "ok", "db": "ok" }`, or `503` when the database is unreachable. Railway's healthcheck. |
| `GET /health/live` | api | Process is up (no dependencies). For uptime monitors. |
| `GET /healthz` | web | Server is up. Railway's healthcheck. |

Health endpoints need no auth or `Origin` header and are never rate-limited.

- **Shutdown**: on `SIGTERM` the API stops accepting connections, finishes in-flight requests, then
  closes the database pool and the PDF browser. Set `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`.
- **Rate limits**: every route allows 300 requests per minute and 25 per second per client IP;
  some routes are stricter (Stripe actions 10/min, data export and account deletion 3/hour). Limits
  are kept in memory, so they apply per replica.
- **Question-pool background fill** (optional): call
  `POST https://<api-domain>/interview-prep/admin/background-fill` with header `x-admin-key:
  $ADMIN_API_KEY` from a scheduler (e.g. a Railway cron service), at most once a minute.
- **Rollback**: Railway → service → Deployments → pick a previous deployment → Redeploy. Database
  migrations are not rolled back, so keep them backwards compatible.
- **PDF export** uses the Chromium headless shell baked into the API image (`PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`);
  the browser version is tied to the `playwright` version in `apps/api/package.json` and the
  `PLAYWRIGHT_VERSION` build argument, and the image build fails if they differ.

## 7. Verify a deploy

```bash
./scripts/health-check.sh https://<api-domain> https://<web-domain>
```

It checks both health endpoints, that auth is enforced, that the Stripe webhook path is reachable
without an `Origin` header, the SPA routes and asset 404s, and that the API's CORS allows the web
origin. `./scripts/deploy.sh [api|web]` deploys the working tree with the Railway CLI if you are not
using the GitHub integration.

CI (`.github/workflows/ci.yml`) runs the typecheck, API and web tests and both builds, smoke-tests
`server.js`, and builds the API image, migrates a fresh Postgres with it, boots it and probes it.

## 8. Troubleshooting

| Symptom | Likely cause |
|---|---|
| API exits at boot with "Invalid environment variables" | The message names each variable to fix. |
| Browser shows CORS errors; API logs `CORS: origin not allowed` | `CLIENT_URL` / `CORS_ORIGINS` do not match the exact web origin (scheme and host; `www` matters). |
| Every request 401 | Wrong `SUPABASE_URL` project, or HS256 tokens without `SUPABASE_JWT_SECRET`. The API logs the reason, e.g. `Authentication failed: ERR_JWT_CLAIM_VALIDATION_FAILED`. |
| `503 Sign-in is temporarily unavailable` | The API cannot reach the Supabase JWKS endpoint. |
| PDF download 503 | Chromium could not start; check the API logs. |
| Stripe dashboard shows webhook `400 Invalid signature` | `STRIPE_WEBHOOK_SECRET` belongs to a different endpoint or mode. |
| Users throttled together | `TRUST_PROXY_HOPS` lower than the real number of proxies. |

## Local development

See [README.md](README.md#local-development). For Stripe webhooks locally:
`stripe listen --forward-to localhost:3000/billing/webhook`.
