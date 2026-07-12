---
title: System Overview
section: 03_Engineering
status: stable
owner: Engineering
created: 2026-07-11
last_updated: 2026-07-12
---

# System Overview

> **Status:** 🟢 Authored — reflects the Phase 0 foundation as built. A high-level map for orientation; see [Architecture](Architecture.md) for the reasoning and [Foundation](Foundation.md) for the build log.

## The repository at a glance

A Turborepo + pnpm monorepo (ADR-0005). Differentiated logic lives in framework-free packages; apps are thin.

```
AI-Receptionist/
├── frontend/            @operatoros/web        Next.js (Vercel) — dashboard, APIs, auth wiring
├── backend/             @operatoros/voice-gateway  long-running service (Phase 4 media bridging)
├── database/            @operatoros/database   Prisma schema, RLS, tenant-scoped client, seed
├── packages/
│   ├── core/            @operatoros/core       framework-free domain logic (RBAC/authz)
│   └── config/          @operatoros/config     shared tsconfig / eslint / prettier
├── infrastructure/      docker-compose (local Postgres), deploy config
├── scripts/             tooling
└── docs/                the source of truth
```

**Dependency rule:** `core` imports no framework (no Next.js, Prisma, or provider SDK). `database` depends on `core` (for the RBAC catalog it seeds). `frontend` and `backend` depend on `database` and `core`. Nothing depends on `frontend`/`backend`.

## Runtime shape (two deploy targets — ADR-0001)

| Target        | Package                     | Hosting                             | Nature                                                                     |
| ------------- | --------------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| Web           | `@operatoros/web`           | Vercel                              | Stateless, request-scoped: dashboard, REST/tRPC APIs, Clerk auth, webhooks |
| Voice gateway | `@operatoros/voice-gateway` | Container host (Fly/Railway/Render) | Stateful, long-lived: holds call-length sockets (Phase 4)                  |

Both share one Postgres and the `database`/`core` packages.

## Identity & authorization flow (ADR-0009)

```
Clerk (authenticates USER)
   │  signed webhook (user.created/updated/deleted)
   ▼
User row (our DB)  ──*  Membership  ──1  Organization (tenant)
                                   │
                                   └─1 Role ──*── Permission   (resolved to a permission Set)
```

- Clerk owns **authentication only**. Our Postgres owns Organizations, Memberships, Roles, Permissions.
- A request resolves: Clerk `userId` → our `User` → `Membership` in the target org → role → **permission set**.
- Every privileged action is gated by `can(permissions, action)` from `@operatoros/core` — deterministic and testable, never dependent on model or vendor behavior.

## Tenant boundary (the critical invariant)

- **Tenant = `Organization`.** Every tenant-owned row carries `organizationId`.
- **Enforcement is at the database**, via Postgres Row-Level Security with `FORCE ROW LEVEL SECURITY` (ADR-0003). A row is visible only when `organizationId = current_setting('app.tenant_id')`.
- **Access pattern:** all tenant data flows through `withTenant(organizationId, fn)` — an interactive transaction that sets the RLS GUC on the same connection as the queries. The raw Prisma client is never exported.
- **Privileged escape hatch:** `withSystem(fn)` sets `app.bypass_rls = 'on'` for legitimately cross-tenant platform ops (provisioning, the Clerk user-sync webhook, seeding, migrations) — never used in user-driven paths.
- **Authorization rules:** identity (Clerk) → membership (DB) → role → permissions (`can()`); RLS is the data-layer backstop even if an application check is ever missed. Full model in [Security](Security.md).

## Request lifecycle (dashboard example, Phase 2+)

1. Clerk middleware authenticates the user (`frontend/middleware.ts`); public routes (`/`, health, webhooks) are exempt.
2. Handler resolves identity + org context via `frontend/src/lib/auth` (`requireIdentity` / `requireOrg` / `requirePermission`).
3. Authorized data access runs through `withTenant(orgId, …)`; RLS scopes every row to the org.
4. Billable side effects append to the immutable `UsageRecord` ledger (ADR-0008); security-relevant actions append to `AuditLog`.

## Data model

See [Database Design](Database_Design.md) for the full entity map. Phase 0 ships identity/RBAC, the AI `Employee` primitive, `KnowledgeSource`, `Integration`, the `UsageRecord` billing ledger, and `AuditLog`.

## Local development

`pnpm install` → `cp .env.example .env` → `pnpm db:generate` → `pnpm db:migrate` → `pnpm db:seed` → `pnpm dev`. Details in [CONTRIBUTING](../../CONTRIBUTING.md) and [Foundation](Foundation.md).

## Related

- [Architecture](Architecture.md) · [Database Design](Database_Design.md) · [Security](Security.md) · [Foundation](Foundation.md) · [Decision Log](Decision_Log.md)
