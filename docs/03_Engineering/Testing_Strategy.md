---
title: Testing Strategy
section: 03_Engineering
status: stable
owner: Engineering
created: 2026-07-11
last_updated: 2026-07-12
---

# Testing Strategy

> **Status:** 🟢 Authored (foundation). Reflects the Phase 0 testing setup and the plan for later layers. Runner: **Vitest**.

## Layers

| Layer                        | What it covers                                                  | Where                                    | Needs a DB?     |
| ---------------------------- | --------------------------------------------------------------- | ---------------------------------------- | --------------- |
| **Unit**                     | Pure logic — RBAC (`can`), errors, service authorization guards | `packages/core`, `packages/services`     | No              |
| **Contract**                 | Zod schemas accept/reject the right shapes                      | `packages/contracts`                     | No              |
| **Integration**              | Data layer + **tenant isolation (RLS)**, service persistence    | `packages/database`, `packages/services` | Yes             |
| **API**                      | Route handlers: auth → service → response mapping               | `frontend` (route tests)                 | Yes (or mocked) |
| **E2E / Conversation evals** | Dashboard flows; scripted AI-call scenarios                     | later phases                             | Yes             |

## Database testing strategy

- Integration tests run against a **disposable Postgres** that has the schema **and the RLS policies** applied (RLS is not optional — it is under test).
- Gated by `RUN_DB_TESTS=1` with `DATABASE_URL` pointing at the test database, so unit runs stay hermetic and fast. CI provisions the DB, runs `prisma migrate deploy`, applies `rls-policies.sql`, then runs the suite.
- Tests clean up what they create (`withSystem` teardown); no shared mutable fixtures across files (`fileParallelism: false` for DB tests).

## Tenant isolation tests (security control)

`database/src/tenant-isolation.test.ts` proves the core invariant: with two organizations, tenant B **cannot read or write** tenant A's rows (RLS `USING` and `WITH CHECK`). This is treated as a security control and **must gate CI** — a failure blocks release. It is the highest-value integration test in the system.

## API testing structure

Route handlers stay thin (ADR-0010), so most logic is covered by service unit/integration tests. Handler tests assert the **edge contract**: unauthenticated → 401, missing permission → 403 (`AuthorizationError` → `httpStatus`), invalid body → 400 (`ValidationError`), success → correct shape. They can run with a mocked service or against the test DB.

## Authentication testing approach

- Clerk is mocked at the boundary (`auth()`), so tests inject a `userId` without a live Clerk.
- Authorization is tested independently and deterministically: services take a `permissions` set, so `assertCan` behavior is unit-tested without auth infrastructure (see `packages/services` tests).
- The Clerk→DB user-sync webhook is tested by posting signed payloads and asserting the resulting `User` rows.

## Phase 0 status

- ✅ Unit: `@operatoros/core` RBAC (7 tests), `@operatoros/services` authorization guards.
- ✅ Integration: `tenant-isolation.test.ts` — **wired into CI** (Postgres service → migrate → create `app_user` → seed → isolation as the limited role) and **verified against a real Postgres** (4/4).
- ⏳ To come: API handler tests (arrive with Phase 2 endpoints); conversation evals (voice phases).

## Related

- [Security](Security.md) · [Database Design](Database_Design.md) · [Foundation Implementation](Foundation_Implementation.md)
