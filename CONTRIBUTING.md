# Contributing to OperatorOS

> Read [`CLAUDE.md`](CLAUDE.md) and [`docs/README.md`](docs/README.md) first. Documentation leads implementation.

## Prerequisites

- Node `>=20` (see `.nvmrc`)
- pnpm `11`
- A Postgres 16 database. Locally: `docker compose -f infrastructure/docker-compose.yml up -d`. Hosted: Neon (see `docs/03_Engineering/Architecture.md`).

## Setup

```bash
pnpm install
cp .env.example .env                 # fill in Clerk keys + DATABASE_URL
pnpm db:generate                     # generate the Prisma client
pnpm db:migrate                      # create tables + apply RLS policies
pnpm db:seed                         # seed permissions + system roles
pnpm dev                             # run the workspace
```

## Monorepo

Turborepo + pnpm workspaces. Packages: `frontend` (web), `backend` (voice-gateway),
`database` (Prisma + RLS), `packages/core` (framework-free domain logic), `packages/config`
(shared tsconfig/eslint/prettier). See [`docs/03_Engineering/System_Overview.md`](docs/03_Engineering/System_Overview.md).

## Git workflow

- **Branch off `main`.** Never commit directly to `main`.
- Conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- Open a PR; the [PR template](.github/pull_request_template.md) enforces the Doc-Driven Development checklist.
- CI must be green: `prisma validate`, `typecheck`, `lint`, `test`, `format:check`.

## Standards

- TypeScript strict. Shared types via `packages/contracts` (added when APIs land).
- Never export the raw Prisma client — all tenant data access goes through `withTenant()` (see `database/src/client.ts`).
- Every architectural decision → an ADR in [`docs/03_Engineering/Decision_Log.md`](docs/03_Engineering/Decision_Log.md).
