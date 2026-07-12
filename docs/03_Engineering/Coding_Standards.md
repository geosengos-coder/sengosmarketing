---
title: Coding Standards
section: 03_Engineering
status: stable
owner: Engineering
created: 2026-07-12
last_updated: 2026-07-12
---

# Coding Standards

> **Status:** 🟢 Authored. The conventions every contributor (human or agent) follows. Complements the operating principles in [`CLAUDE.md`](../../CLAUDE.md); this document is the concrete "how." Restores the standard dropped in [ADR-0006](Decision_Log.md).

## 1. Engineering principles

1. **Correctness and security over speed.** A subtle multi-tenant leak or a hallucinated action costs more than a slower ship. Prove security-critical behavior (see [Testing](#4-testing-expectations)).
2. **Layers point downward.** `frontend`/`backend` → `services` → (`contracts`, `database`, `core`). `core` imports no framework/DB; `services` holds business logic; routes stay thin ([ADR-0010](Decision_Log.md#adr-0010--layered-backend-thin-routes-over-a-service-layer)).
3. **Make the safe path the only path.** Tenant data is reachable only through `withTenant`; the raw Prisma client is never exported. Prefer designs where the wrong thing is impossible, not merely discouraged.
4. **Boring, explicit, and typed.** No cleverness that a new engineer can't read in two years. No hidden globals — context (tenant, actor, permissions, logger) is passed explicitly.
5. **Match the surrounding code.** New code reads like the file it lives in.

## 2. Language & style

- **TypeScript, `strict` everywhere** (plus `noUncheckedIndexedAccess`, `verbatimModuleSyntax`). No `any` without a written reason; prefer `unknown` + validation at boundaries.
- **`import type` for type-only imports** (enforced by `verbatimModuleSyntax`).
- **Formatting is not a matter of taste** — Prettier (`.prettierrc.json`) and ESLint (flat config in `packages/config`) decide. Run `pnpm format` / `pnpm lint`; CI runs `format:check`.
- **Naming:** `PascalCase` types/components, `camelCase` values, `SCREAMING_SNAKE` const catalogs (e.g. `PERMISSIONS`), kebab-case file names. Prisma models `PascalCase`; DB columns follow Prisma defaults.
- **Errors are typed and explicit.** Throw domain errors from `@operatoros/core` (`ValidationError`, `NotFoundError`, `ForbiddenError`, …), each carrying an `httpStatus`; the edge maps them uniformly via `serializeError`. No silent `catch`; never swallow.
- **No secrets in code.** Config comes from validated env (`frontend/src/env.ts` pattern); `.env` is git-ignored; `.env.example` documents required vars.

## 3. Architecture conventions

- **Services** follow one shape: **authorize** (`assertCan`) → **validate** (`validate(schema, input)` from contracts) → **persist** (`withTenant`) → **log**. No HTTP, no `Response` objects in services.
- **Validation lives in `@operatoros/contracts`** (Zod). Never hand-roll input checks in a route or service body; define a schema and `validate()` it.
- **Every tenant query goes through `withTenant(organizationId, …)`.** `withSystem` is only for genuinely cross-tenant platform ops (provisioning, webhooks, seed) and never in user-driven paths.
- **Idempotency at external boundaries** (usage ledger, webhooks, bookings).
- **APIs are versioned** (`/api/v1`) and typed end-to-end from `contracts`.

## 4. Testing expectations

- **Test the layer where logic lives.** Pure logic (`core`, service authorization) → fast unit tests; schemas → contract tests; data access + isolation → integration tests against a real Postgres.
- **Security controls are tested, not assumed.** The cross-tenant isolation suite (`database/src/tenant-isolation.test.ts`) must stay green and runs in CI as the limited `app_user` role — a failure blocks release.
- **New behavior ships with tests.** A bug fix includes a test that would have caught it. Prefer deterministic tests (services take an explicit `permissions` set, so auth is testable without a live Clerk).
- **Commands:** `pnpm test` (unit/contract, hermetic); `RUN_DB_TESTS=1 pnpm --filter @operatoros/database test` (integration). See [Testing Strategy](Testing_Strategy.md).

## 5. Documentation requirements

- **Docs lead implementation.** No major feature is coded before its spec exists; update Roadmap → Feature Spec → Architecture → API → Database Design → Release notes as you go (enforced by the [PR template](../../.github/pull_request_template.md)).
- **Every notable decision → an ADR** in the [Decision Log](Decision_Log.md), with context and alternatives — the reasoning is the asset.
- **Docs and code never disagree.** Fix docs in the same change that changes behavior. Keep frontmatter `status`/`last_updated` honest.
- **Comment the "why," not the "what."** Public functions get a short doc comment; tricky invariants (e.g. the RLS/interactive-transaction pattern) get an explanatory note.

## 6. Git & review standards

- **Branch off `main`; never commit directly** (after the initial commit). Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- **Small, focused PRs.** One concern per PR; the [PR template](../../.github/pull_request_template.md) documentation checklist must be satisfied.
- **CI is the floor, not the ceiling.** `prisma validate`, `typecheck`, `lint`, `test`, `format:check`, and the tenant-isolation job must be green to merge.
- **Review looks for:** correctness and security first (especially tenant scoping and authorization), then layering violations (business logic in routes, `core` importing a framework), then tests and docs, then style (which should already be automated).
- **Migrations are reviewed with extra care;** RLS/policy changes require explicit sign-off, and any new tenant-owned table must be added to `rls-policies.sql` and covered by isolation.

## Related

- [`CLAUDE.md`](../../CLAUDE.md) · [Architecture](Architecture.md) · [Testing Strategy](Testing_Strategy.md) · [Security](Security.md) · [Decision Log](Decision_Log.md)
