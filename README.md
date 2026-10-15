# careerRepo (career-portal)

A freemium career toolkit: CV builder with PDF export, cover letters, job tracker with CV-to-job
match scores, mock interviews and technical tests, with AI assistance.

Nx + pnpm monorepo: NestJS API, React (Vite) web app, Prisma on PostgreSQL. Sign-in is Supabase,
payments Stripe, AI OpenAI.

## Prerequisites

- Node.js 22
- pnpm 9.15 (`corepack enable` picks the version in `package.json`)
- Docker (for the local Postgres)
- A Supabase project (auth), and test-mode Stripe and OpenAI keys for those features

## Local development

```bash
pnpm install
pnpm db:up                       # Postgres 16 on 127.0.0.1:5432 (docker compose)
cp apps/api/.env.example apps/api/.env   # fill in Supabase, OpenAI, Stripe
cp apps/web/.env.example apps/web/.env
pnpm db:generate                 # Prisma client
pnpm db:migrate                  # apply migrations
pnpm db:seed                     # interview question bank (+ dev rows outside production)
pnpm api                         # http://localhost:3000 (Swagger at /docs)
pnpm web                         # http://localhost:4200
```

Sign up through the web app; the API creates your user on the first authenticated request.

Stripe webhooks locally: `stripe listen --forward-to localhost:3000/billing/webhook`, and put the
printed secret in `STRIPE_WEBHOOK_SECRET`.

## Checks

```bash
pnpm typecheck    # API and web
pnpm test:api     # API unit tests (node:test)
pnpm test:web     # web unit tests (node:test via vite-node)
pnpm build:api    # dist/apps/api
pnpm build:web    # apps/web/dist (needs the VITE_* variables)
```

CI runs all of these on every pull request (`.github/workflows/ci.yml`).

## Project structure

```
apps/
  api/                NestJS API (src/modules/*), Prisma schema and migrations
  web/                React app (Vite)
libs/
  shared/types/       Types and plan limits shared by API and web
  web/data-access/    API client, React Query hooks
  web/ui/             UI components
Dockerfile.api        API image
server.js             Production web server for the built SPA
scripts/              deploy.sh, health-check.sh
```

## Deployment

Railway, one service each for the API and the web app. See [DEPLOYMENT.md](DEPLOYMENT.md) for
the environment variables, Supabase and Stripe go-live steps, migrations and health checks.
