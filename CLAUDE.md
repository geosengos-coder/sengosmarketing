# CLAUDE.md — OperatorOS Operating Manual

This is the permanent operating manual for the OperatorOS repository. Every Claude Code session should read it first and follow it. It is intentionally concise and evergreen: it states _how we think and work_, not transient task detail. When guidance here conflicts with a one-off request, surface the conflict rather than silently overriding this file.

> **Companion docs:** the full source of truth lives in [`docs/`](docs/). This file is the compass; `docs/` is the map. Key anchors: [Vision](docs/01_Founder_Bible/Vision.md), [Roadmap](docs/01_Founder_Bible/Roadmap.md), [Architecture](docs/03_Engineering/Architecture.md), [Decision Log](docs/03_Engineering/Decision_Log.md).

---

## Vision

**OperatorOS is the operating system for AI Employees** — the platform on which any business can hire, configure, and run AI workers that talk to their customers and do real operational work.

The first AI employee is an **AI Receptionist** (answers calls, books appointments, qualifies leads). It is the beachhead, not the destiny. Every decision must support a future of **unlimited AI employees sharing one platform**.

**The platform principle (non-negotiable):** an AI Employee = _persona + skills (tools) + knowledge base + channels + guardrails_. The receptionist is a **configuration**, not a codebase. If receptionist-specific logic ever leaks outside of configuration, that is an architecture bug to correct.

---

## Engineering principles

1. **Take real-time voice seriously.** A call is a long-lived, stateful socket with a sub-second budget. This forces two deploy targets — stateless `web` on Vercel, long-running `voice-gateway` on a container host. Never try to put the voice loop on serverless. (ADR-0001)
2. **The brain is framework-free.** `core`, `ai`, and `knowledge` packages import no framework (no Next.js, no Twilio). Adapters depend on them, never the reverse. This is what makes services replaceable. (ADR-0005)
3. **Everything is a platform primitive.** Add capabilities by registering typed, idempotent **tools** in the Tool Registry — not by forking the engine.
4. **Providers are swappable.** Voice, LLM, and embedding providers sit behind interfaces. Ship on the best option today; never lock the business logic to it. (ADR-0002)
5. **Tenant isolation is a database guarantee, not a discipline.** Every tenant row carries `businessId`; Postgres RLS is the hard backstop; the raw DB client is never exported. (ADR-0003)
6. **Idempotency at every external boundary** — bookings, webhooks, billing.
7. **Version APIs from commit one** (`/api/v1`). Internal via tRPC, public via REST/OpenAPI, both generated from shared Zod contracts.
8. **Observability is not optional.** Every AI turn is traced (prompt, retrieval, tool calls, latency, cost).
9. **Scale assumption: millions of tenants, thousands of concurrent calls.** Prefer designs that don't need a rewrite to get there; record deliberate shortcuts as ADRs in the [Decision Log](docs/03_Engineering/Decision_Log.md).

---

## Product philosophy

- **Trust is the product.** An AI employee that invents a price or double-books is worse than no employee. Grounded, honest, and safe by default beats clever.
- **Handcrafted, never generic.** No boilerplate dashboards, no template SaaS feel. Every surface should feel deliberate.
- **Time-to-live-employee is the core metric.** Signup → connected calendar → live answering, same day.
- **Know when to hand off.** A clean escalation to a human is a feature, not a failure.
- **Modular and replaceable.** Every feature modular; every service replaceable.

---

## Design philosophy

- **Tokens-first.** CSS variables → Tailwind theme → shadcn/ui primitives → composed product components in `packages/ui`.
- **Theme- and white-label-ready from the start** (light/dark and per-tenant theming baked into the token layer, not retrofitted).
- **Motion is purposeful.** Framer Motion serves comprehension, never decoration.
- **Accessible by default** (WCAG targets are requirements, not aspirations).

---

## Documentation standards

**Documentation drives development. It is not secondary.**

- **Doc-Driven Development:** no major feature is coded before its documentation exists. If requirements are unclear, write/propose the doc first, then implement.
- **One concept per document**; link generously instead of duplicating.
- **Record decisions with context and alternatives**, not just outcomes — the reasoning is the asset. All architecture decisions go in the [Decision Log](docs/03_Engineering/Decision_Log.md) as ADRs.
- **Docs and code never disagree.** If they do, that is a bug; fix docs in the same change.
- Keep frontmatter `status` and `last_updated` honest. Prefer tables and diagrams over long prose.

**On every feature, update in order:** (1) Roadmap → (2) Feature Specifications → (3) Architecture (if design changed) → (4) API Strategy (if contracts changed) → (5) Database Design (if data model changed) → (6) Release notes. Enforced by the PR template.

---

## Coding standards

- **TypeScript everywhere**, strict mode. No `any` without a written reason.
- **Types and contracts are shared, not duplicated** — define once in `packages/contracts` (Zod), derive everywhere.
- **Match surrounding code.** New code reads like the file it lives in — naming, structure, comment density.
- **Small, pure, testable units** in the core packages. Side effects live at the edges (adapters).
- **Errors are explicit and typed.** No silent catches. External calls are wrapped, retried where safe, and idempotent where they mutate.
- **No secrets in the repo.** Config via env; `.env.example` documents required vars.
- **Every mutation is authorized and tenant-scoped** through the `forTenant(businessId)` client.

---

## Repository workflow

- **Monorepo:** Turborepo + pnpm. Top-level: `frontend/`, `backend/`, `packages/`, `database/`, `infrastructure/`, `scripts/`, `docs/`, `.github/`.
- **Branch, don't commit to `main` directly.** Never commit or push unless explicitly asked.
- **PRs carry the documentation checklist** (see `.github/pull_request_template.md`). A feature PR with no doc updates is incomplete.
- **CI gates:** typecheck, lint, unit, contract, integration (incl. the cross-tenant isolation suite), conversation evals, and e2e must pass.
- **Migrations are reviewed;** RLS policy changes require explicit sign-off.

---

## Expectations for architectural decision-making

- **Think like a principal engineer.** Do not just execute — challenge weak decisions and recommend better ones, with reasoning.
- **Prefer scalability, reliability, maintainability, and DX over short-term speed.** Avoid technical debt; when you take it deliberately, document it.
- **Reversible vs. irreversible:** move fast on reversible decisions; slow down and write an ADR for irreversible ones (data model, tenancy, provider boundaries, deploy topology).
- **Every notable decision becomes an ADR** in the Decision Log — context, decision, alternatives, consequences. Supersede old ADRs; never rewrite history.
- **When unsure, ask or write it down.** Ambiguity resolved in prose is cheap; ambiguity resolved in production is not.

---

_This file is the compass for every OperatorOS session. Keep it short. If it grows past ~2 pages, a principle probably belongs in a `docs/` document instead._
