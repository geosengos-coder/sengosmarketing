# Platform (Phase 2 — parked, not deleted)

This directory holds the multi-tenant SaaS platform: Postgres/Prisma + RLS, Clerk
auth, the authenticated dashboard, the Clerk user-sync webhook, and the
`voice-gateway` skeleton. None of it is abandoned — it's excluded from the
Phase 1 deploy (the marketing/demo site in `frontend/`) so that site can ship to
Vercel with zero backend infrastructure and zero required env vars.

`platform/` is **not** a pnpm workspace member (see `pnpm-workspace.yaml`'s
`packages:` glob), so `pnpm install`, `turbo run build`, and Vercel never touch
anything in here.

## What's here

- `database/` — the `@operatoros/database` package (Prisma schema, RLS, tenant client).
- `backend/` — the `@operatoros/voice-gateway` skeleton (long-running call-media host, Phase 4).
- `packages/services/` — `@operatoros/services`, tenant/dashboard CRUD use-cases.
- `packages/contracts/` — `@operatoros/contracts`, Zod contracts consumed by `services`.
- `frontend-app/` — the pieces of the Next.js app that belong to the authenticated
  product, parked out of `frontend/`:
  - `(app)/`, `(auth)/` — the dashboard and Clerk sign-in/sign-up route groups
  - `api/webhooks/` — the Clerk → DB user-sync webhook
  - `middleware.ts` — Clerk route protection
  - `lib/auth/`, `contexts/organization-context.tsx`, `components/app-shell.tsx`, `config/nav.ts`

`packages/core/src/authz/` (RBAC — permissions, roles, `can`) stayed in place inside
the still-active `@operatoros/core` package; it's just no longer re-exported from
`packages/core/src/index.ts`. It's framework-free and harmless to leave there.

## Reviving Phase 2

1. Add `platform/database`, `platform/backend`, `platform/packages/*` back into
   `pnpm-workspace.yaml`'s `packages:` glob (or move these directories back to
   their original top-level locations).
2. Move `platform/frontend-app/*` back into `frontend/` at the matching paths
   (e.g. `platform/frontend-app/(app)` → `frontend/app/(app)`).
3. Re-add `@clerk/nextjs`, `svix`, `@operatoros/database`, `@operatoros/services`,
   `@operatoros/contracts` to `frontend/package.json`, and those same three
   package names back into `frontend/next.config.mjs`'s `transpilePackages`.
4. Re-export `./authz` from `packages/core/src/index.ts`.
5. Restore `DATABASE_URL`, `DIRECT_URL`, and the `CLERK_*` env vars.
6. Re-add the `db:*` scripts to the root `package.json` and the
   `@operatoros/database#build` task override to `turbo.json`.
