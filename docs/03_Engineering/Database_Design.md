---
title: Database Design
section: 03_Engineering
status: stable
owner: Engineering
created: 2026-07-11
last_updated: 2026-07-12
---

# Database Design

> **Status:** 🟢 Authored — reflects the Phase 0 schema as built (`database/prisma/schema.prisma`). Update this doc in the same change that alters the schema (see [Doc-Driven Development](../README.md#doc-driven-development)).

## Principles

1. **Every organization-owned row carries `organizationId`**, indexed, and is protected by Row-Level Security ([ADR-0003](Decision_Log.md#adr-0003--enforce-tenant-isolation-with-rls-not-just-app-code)). Even 1:1 child tables (e.g. `AIEmployeeConfiguration`, `BusinessProfile`) carry `organizationId` directly so isolation never depends on a join.
2. **DB-authoritative identity.** Postgres owns Organizations, Members, Roles, and Permissions; Clerk authenticates users only ([ADR-0009](Decision_Log.md#adr-0009--db-authoritative-organizations-clerk-for-authentication-only)).
3. **The AI Employee is the central primitive.** The receptionist is a row, not a table.
4. **Store time in UTC**; render in the tenant's timezone. **Idempotent** external-effect writes (usage ledger, events).
5. **Clean and extensible, not speculative.** Only foundational tables now; voice/scheduling/embedding tables arrive with their phases.

## Tenancy model

`Organization` is the **tenant**. `User` is a global identity (may belong to many organizations) mirrored from Clerk. `OrganizationMember` links a user to an organization with a `Role`; authorization resolves role → permissions.

## Entities (Phase 0, as built)

### Identity & Access

| Entity               | Key fields                                                                             | Scope                             | Notes                                                                             |
| -------------------- | -------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| `User`               | `id`, `clerkUserId` (unique), `email` (unique), `firstName?`, `lastName?`, `imageUrl?` | Global                            | Mirrored from Clerk via signed webhook.                                           |
| `Organization`       | `id`, `slug` (unique), `name`, `plan`, `status`                                        | Tenant root                       | RLS: a tenant sees only itself.                                                   |
| `OrganizationMember` | `id`, `organizationId`, `userId`, `roleId`, `status`                                   | Tenant                            | Unique `(organizationId, userId)`.                                                |
| `Role`               | `id`, `key`, `name`, `description`, `isSystem`, `organizationId?`                      | Global (system) / Tenant (custom) | System roles seeded with `organizationId = null`. Unique `(organizationId, key)`. |
| `Permission`         | `id`, `key` (unique), `description`, `category`                                        | Global catalog                    | Seeded from `@operatoros/core`.                                                   |
| `RolePermission`     | `id`, `roleId`, `permissionId`                                                         | Follows role                      | Unique `(roleId, permissionId)`.                                                  |

### AI Platform Foundation

| Entity                    | Key fields                                                                                                       | Notes                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `AIEmployee`              | `id`, `organizationId`, `name`, `type`, `status`                                                                 | The AI employee primitive (`type = RECEPTIONIST`).                                         |
| `AIEmployeeConfiguration` | `id`, `aiEmployeeId` (unique), `organizationId`, `persona?`, `voice?`, `greeting?`, `instructions?`, `settings?` | 1:1 with `AIEmployee`; carries `organizationId` for direct RLS.                            |
| `KnowledgeSource`         | `id`, `organizationId`, `type`, `name`, `status`, `metadata?`                                                    | A source of business knowledge.                                                            |
| `KnowledgeDocument`       | `id`, `organizationId`, `knowledgeSourceId`, `title`, `content?`, `status`, `metadata?`                          | A document within a source. Chunks/embeddings (pgvector) arrive with the Knowledge Engine. |

### Business Foundation

| Entity            | Key fields                                                                                       | Notes                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `Location`        | `id`, `organizationId`, `name`, address fields, `timezone`, `phone?`                             | A physical/service location.                                                                                           |
| `BusinessProfile` | `id`, `organizationId` (unique), `legalName?`, `industry?`, `description?`, `website?`, `hours?` | 1:1 with `Organization`; the business context that grounds the AI.                                                     |
| `Integration`     | `id`, `organizationId`, `provider`, `status`, `credentialsRef?`, `metadata?`                     | Unique `(organizationId, provider)`. Credentials stored as a **vault reference**, never raw ([Security](Security.md)). |

### Platform Operations

| Entity        | Key fields                                                                                                                     | Notes                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UsageRecord` | `id`, `organizationId`, `metric`, `quantity` (Decimal), `unit`, `idempotencyKey` (unique), `source`, `occurredAt`, `metadata?` | **Append-only billing ledger** (no `updatedAt`); exactly-once ([ADR-0008](Decision_Log.md#adr-0008--separate-the-billing-ledger-from-the-analytics-pipeline)). |
| `AuditLog`    | `id`, `organizationId`, `actorType`, `actorId?`, `action`, `targetType?`, `targetId?`, `metadata?`                             | Append-only **security** trail (actor: `USER`/`SYSTEM`/`AI_EMPLOYEE`).                                                                                         |
| `EventLog`    | `id`, `organizationId`, `type`, `source`, `payload?`, `occurredAt`                                                             | Append-only **analytics/domain-event** stream — distinct from `AuditLog` and from billing.                                                                     |

### Enums

`PlanTier`, `OrganizationStatus`, `MemberStatus`, `EmployeeType`, `EmployeeStatus`, `KnowledgeSourceType`, `KnowledgeSourceStatus`, `KnowledgeDocumentStatus`, `IntegrationProvider`, `IntegrationStatus`, `UsageMetric`, `ActorType`.

## Relationships (high level)

```
User 1─* OrganizationMember *─1 Organization
OrganizationMember *─1 Role ──*── Permission (via RolePermission)
Organization 1─1 BusinessProfile
Organization 1─* Location | AIEmployee | KnowledgeSource | Integration | UsageRecord | AuditLog | EventLog
AIEmployee 1─1 AIEmployeeConfiguration
KnowledgeSource 1─* KnowledgeDocument
```

## Row-Level Security

RLS is the canonical isolation mechanism (`database/prisma/sql/rls-policies.sql`). All organization-owned tables are `FORCE ROW LEVEL SECURITY` with the policy `organizationId = current_setting('app.tenant_id')` (and `Organization` on `id`); an `app.bypass_rls = 'on'` GUC exists for privileged system operations. Context is set per interactive transaction by `withTenant()` / `withSystem()` (`database/src/client.ts`); the raw Prisma client is never exported. `User`, `Permission`, and `RolePermission` are global reference/identity data mediated by the application layer.

## Data access pattern

```ts
const employees = await withTenant(orgId, (db) => db.aIEmployee.findMany());   // RLS-scoped
await withSystem((db) => db.user.upsert({ ... }));                             // privileged
```

## Open questions

- Embedding dimension / chunk table for `KnowledgeDocument` (Knowledge Engine phase).
- Retention for `AuditLog` / `EventLog` and (later) recordings.
- Per-organization custom roles: management UX and RLS write policy.

## Related

- [Architecture](Architecture.md) · [Security](Security.md) · [System Overview](System_Overview.md) · [Decision Log](Decision_Log.md)
