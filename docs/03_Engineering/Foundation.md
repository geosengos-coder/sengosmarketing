---
title: Phase 0 — Foundation
section: 03_Engineering
status: stable
owner: Engineering
created: 2026-07-12
last_updated: 2026-07-12
---

# Phase 0 — Foundation (Build Log)

> **Status:** 🟢 Complete. The record of what the Phase 0 spine actually is: what was built, the decisions made during the build, how to run it, and what remains. Orientation lives in [System Overview](System_Overview.md).

## What was built

**Monorepo foundation** — Turborepo + pnpm workspace (`frontend`, `backend`, `database`, `packages/core`, `packages/config`). Shared TypeScript (strict), ESLint (flat config), and Prettier via `@operatoros/config`. Root scripts (`dev`/`build`/`lint`/`typecheck`/`test`/`format`) fan out through Turbo. `.nvmrc`, `.npmrc`, `.editorconfig`, `.env.example`.

**Database foundation** (`database/`) — Prisma schema for the multi-tenant model: `User`, `Organization`, `Membership`, `Role`, `Permission`, `RolePermission`, `Employee`, `KnowledgeSource`, `Integration`, `UsageRecord` (append-only billing ledger), `AuditLog`, plus enums. Every tenant table carries `organizationId`. See [Database Design](Database_Design.md).

**Tenant isolation** — `database/prisma/sql/rls-policies.sql` enables `FORCE ROW LEVEL SECURITY` on all tenant tables with an `organizationId = app.tenant_id` policy and an `app.bypass_rls` escape hatch. `database/src/client.ts` exposes only `withTenant(orgId, fn)` and `withSystem(fn)` — interactive transactions that set the RLS GUC on the same connection; the raw Prisma client is not exported.

**RBAC** (`packages/core/src/authz`) — framework-free permission catalog, system roles (owner/admin/member) with grants, and pure `can` / `canAll` / `canAny` / `assertCan` checks. This is the single source of truth; the DB permission/role tables are **seeded from it** (`database/src/seed.ts`).

**Authentication** (`frontend/`) — Clerk middleware; a signed Clerk→DB user-sync webhook (`app/api/webhooks/clerk`); validated env (`src/env.ts`); and authorization helpers (`src/lib/auth`) that resolve a Clerk user → org membership → permission set and guard with `requireIdentity` / `requireOrg` / `requirePermission`.

**Voice-gateway skeleton** (`backend/`) — a minimal long-running service with a health endpoint, establishing the second deploy target. No media handling yet (Phase 4).

**Dev infrastructure** — `infrastructure/docker-compose.yml` (local Postgres 16), `.github/workflows/ci.yml` (install → prisma validate → generate → typecheck → lint → test → format check), and `CONTRIBUTING.md` (setup + git workflow).

## Verification (this build)

Run against the real toolchain (Node, pnpm):

- `pnpm install` — 372 packages, clean.
- `prisma validate` — schema valid; `prisma generate` — client generated.
- `@operatoros/core` tests — **7/7 passing** (RBAC role grants + combinators + assert).
- Typecheck — `core`, `database`, and `frontend` all **0 errors**.

> Not yet run: `prisma migrate` and the seed require a live Postgres (Docker was unavailable in this environment). The migration + a cross-tenant RLS integration test are the first follow-ups (see below).

## Major decisions made during the build

- **DB-authoritative identity** — Postgres owns orgs/members/roles/permissions; Clerk authenticates users only. Recorded as [ADR-0009](Decision_Log.md#adr-0009--db-authoritative-organizations-clerk-for-authentication-only).
- **RLS via interactive transactions, not client extensions** — the Prisma client-extension approach does not guarantee that `SET LOCAL` and the query share a connection, so the GUC may not apply. `withTenant`/`withSystem` use `$transaction` so `set_config` and the queries run on one connection. (Correctness fix caught during implementation.)
- **RBAC source of truth in `core`, DB seeded from it** — avoids drift between code checks and seeded data.
- **Tenant column named `organizationId`** (tenant = `Organization`), reconciling the earlier `Business`/`businessId` naming with the Phase 0 entity list. Docs updated to match.
- **pnpm build-script allowlist** (`pnpm-workspace.yaml` `onlyBuiltDependencies`) — pnpm sandboxes install scripts by default; only the needed native builds (Prisma engine, esbuild, sharp, Clerk, resolver) are allowlisted.

## Setup instructions

```bash
pnpm install
cp .env.example .env            # set Clerk keys + DATABASE_URL / DIRECT_URL
docker compose -f infrastructure/docker-compose.yml up -d   # or point at Neon
pnpm db:generate                # generate the Prisma client
pnpm db:migrate                 # create tables (then apply rls-policies.sql — see below)
pnpm db:seed                    # seed permissions + system roles
pnpm dev
```

**Applying RLS:** `rls-policies.sql` is the canonical policy definition. It must be attached to the initial Prisma migration (append its statements to the generated migration) so RLS ships with the schema. This wiring is the first migration task.

## Future considerations / follow-ups

- **First migration + RLS wiring** and a **cross-tenant isolation integration test** (asserts one org cannot read/write another's rows) — gate this in CI; it is a security control, not a nicety.
- **Organization provisioning path** (signup → create org + owner membership) using `withSystem`, arriving with Phase 2.
- **Coding_Standards.md** and **Technical_Debt.md** — restore (dropped in ADR-0006); coding standards should exist before Phase 1 code.
- **Compliance.md + data classification** (Risk R-01) before knowledge/voice phases.
- **`packages/contracts`** (shared Zod + API types) when APIs land in Phase 2.
- **Connection pooling** that preserves session context (Neon / PgBouncer transaction mode) — required for the `set_config` RLS pattern at scale (ADR-0003).

## Related

- [System Overview](System_Overview.md) · [Architecture](Architecture.md) · [Database Design](Database_Design.md) · [Security](Security.md) · [Decision Log](Decision_Log.md) · [Risk Register](Risk_Register.md)
