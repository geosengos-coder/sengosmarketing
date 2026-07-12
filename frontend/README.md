# frontend

The customer-facing **Next.js** application (dashboard, onboarding, marketing surfaces) deployed to **Vercel**.

- App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion.
- Talks to shared logic via `packages/` and to the database via `database/`.
- Does **not** own live-call sockets — those live in `backend/` (voice gateway).

> Scaffold only. No application code yet. See [/docs/03_Engineering/Architecture.md](../docs/03_Engineering/Architecture.md).
