# Career Portal

Full-stack Nx monorepo: NestJS + React + Prisma + PostgreSQL.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Generate Prisma client
pnpm nx run api:prisma-generate

# 4. Run migrations
pnpm nx run api:prisma-migrate

# 5. Seed database
pnpm nx run api:prisma-seed

# 6. Start API (http://localhost:3000)
pnpm nx serve api

# 7. Start Web (http://localhost:4200) — in another terminal
pnpm nx serve web
```

## Dev Login

- Email: `admin@careerportal.dev`
- Password: `password123`

## API Docs (Swagger)

Available in dev at: http://localhost:3000/docs

## Project Structure

```
apps/
  api/          — NestJS backend
  web/          — React frontend
libs/
  shared/types/ — Shared TypeScript types
  web/data-access/ — API client + React Query hooks
  web/ui/       — Reusable UI components
```
