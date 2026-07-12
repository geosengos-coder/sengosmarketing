---
title: Foundation Implementation
section: 03_Engineering
status: stable
owner: Engineering
created: 2026-07-12
last_updated: 2026-07-12
---

# Foundation Implementation

> **Status:** 🟢 Complete (Phase 0 spine). The build log for the platform foundation: what exists, how it fits together, how to run it, what's deliberately deferred, and what comes next. Orientation: [System Overview](System_Overview.md). Decisions: [Decision Log](Decision_Log.md).

## What was built

### 1. Database schema (`database/prisma/schema.prisma`)

Multi-tenant model across four groups:

- **Identity & Access:** `User`, `Organization`, `OrganizationMember`, `Role`, `Permission`, `RolePermission`.
- **AI Platform:** `AIEmployee`, `AIEmployeeConfiguration`, `KnowledgeSource`, `KnowledgeDocument`.
- **Business:** `Location`, `BusinessProfile`, `Integration`.
- **Platform Ops:** `UsageRecord` (append-only billing ledger), `AuditLog` (security), `EventLog` (analytics/domain events).

Every organization-owned row — including 1:1 children — carries `organizationId` directly. Full reference: [Database Design](Database_Design.md).

### 2. Tenant isolation

- `database/prisma/sql/rls-policies.sql` — `FORCE ROW LEVEL SECURITY` on all 13 tenant tables; policy `organizationId = current_setting('app.tenant_id')` (Organization on `id`), with an `app.bypass_rls` system escape hatch.
- `database/src/client.ts` — exposes only `withTenant(orgId, fn)` and `withSystem(fn)`, interactive transactions that set the RLS GUC on the **same connection** as the queries. The raw Prisma client is never exported.
- `database/src/tenant-isolation.test.ts` — an integration test that proves cross-tenant read/write denial.

### 3. Backend architecture (layered — ADR-0010)

- **`packages/core`** — framework-free: RBAC (`can`/`assertCan`), the error hierarchy (`AppError` → HTTP status), and a structured JSON logger. Zero framework deps.
- **`packages/contracts`** — Zod schemas + inferred types (validation source of truth).
- **`packages/services`** — the use-case layer. Each service: **authorize** (`assertCan`) → **validate** (`validate(schema, input)`) → **persist** (`withTenant`) → **log**. Example services for organizations and AI employees.
- Routes stay thin: parse → call service → map result/error to a response (`AppError.httpStatus`, `serializeError`).

### 4. Frontend foundation (`frontend/`)

- App shell (`src/components/app-shell.tsx`): sidebar nav + top bar, structure only.
- Auth states: Clerk middleware + `/sign-in` and `/sign-up` (Clerk components); `UserButton` in the shell.
- Organization context (`src/contexts/organization-context.tsx`): the tenant a client component reads.
- Navigation structure (`src/config/nav.ts`) — routes declared; feature pages are later phases.
- Design-system foundation: Tailwind wired to CSS-variable tokens (`app/globals.css`, canonical in `@operatoros/ui/tokens.css`); `@operatoros/ui` ships `cn()` + a token-driven `Button`.

### 5. Testing foundation

Vitest. Unit (core RBAC, service authorization guards), contract (schemas), and an integration **tenant-isolation** suite gated by `RUN_DB_TESTS=1`. Full plan: [Testing Strategy](Testing_Strategy.md).

## How the architecture works

```
HTTP / React (frontend, backend)        ← thin: auth, transport, rendering
        │  ServiceContext { organizationId, actorUserId, permissions, logger }
        ▼
packages/services   authorize → validate → persist → log
   ├── packages/contracts   (Zod schemas)
   ├── packages/database     withTenant / withSystem  → Postgres RLS
   └── packages/core         RBAC · errors · logging  (zero deps)
```

- **Identity:** Clerk authenticates users → mirrored to `User` via signed webhook. Our DB owns orgs/members/roles/permissions (ADR-0009).
- **Authorization:** role → permission set → deterministic `can()` in services. Never dependent on vendor or model behavior.
- **Isolation:** enforced at the database by RLS; `withTenant` is the only door to tenant data.
- **Errors:** thrown as domain errors in `core`/services, carrying an HTTP status the edge maps uniformly.

## How developers run the project

```bash
pnpm install
cp .env.example .env             # Clerk keys + DATABASE_URL / DIRECT_URL
docker compose -f infrastructure/docker-compose.yml up -d   # or Neon
pnpm db:generate
pnpm db:migrate                  # then attach rls-policies.sql to the migration
pnpm db:seed                     # permissions + system roles
pnpm dev

# Checks
pnpm typecheck && pnpm test
RUN_DB_TESTS=1 pnpm --filter @operatoros/database test   # tenant isolation (needs DB)
```

**Verified in this build:** `pnpm install` clean; `prisma validate` + `generate` pass; typecheck **0 errors** across core, contracts, services, ui, database, frontend; unit tests **9/9** (core 7, services 2).

## Migration, RLS & CI (security milestone — done)

- **Initial migration** (`database/prisma/migrations/20260712000000_init/`) creates all 16 tables **and** the RLS policies in one migration, so isolation ships with the schema.
- **`app-role.sql`** creates the limited `app_user` role (RLS is bypassed for superusers, so the app/tests must connect as this role).
- **CI** ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)) has a `database` job: Postgres service → `migrate deploy` → create `app_user` → seed → run the isolation suite **as `app_user`**. This gates every build.
- **Verified against a real Postgres** in this build (ephemeral instance): the repo's `tenant-isolation.test.ts` passed 4/4 as `app_user` — tenant B cannot read or write tenant A's rows, deny-by-default holds, and system-bypass works.

## Known limitations

- **No feature pages/endpoints** — deliberately. Shell, services, and contracts are patterns to build on, not product surfaces.
- **Active-organization resolution** is stubbed (`OrganizationProvider organization={null}`); wired in Phase 2.
- **Custom per-org roles** are schema-ready but unused (Phase 0 ships system roles only).
- **Design system** is a foundation (tokens + one primitive), not the full library (Phase 1).
- **Migration not yet run against a hosted DB** — verified against an ephemeral Postgres and gated in CI; a real environment (Neon) is provisioned in Phase 1/2 ops.

## Next recommended phase

**Phase 1 — Website + Brand Experience**, then **Phase 2 — Business Dashboard**: organization provisioning (`withSystem`), active-org resolution, member management, and the first real endpoints built on the service layer. Before knowledge/voice phases, author **Compliance.md** (Risk R-01).

## Related

- [System Overview](System_Overview.md) · [Architecture](Architecture.md) · [Database Design](Database_Design.md) · [Security](Security.md) · [Testing Strategy](Testing_Strategy.md) · [Decision Log](Decision_Log.md) · [Risk Register](Risk_Register.md)
