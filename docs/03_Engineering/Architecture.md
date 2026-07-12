---
title: Architecture
section: 03_Engineering
status: stable
owner: Engineering
created: 2026-07-11
last_updated: 2026-07-11
---

# Architecture

> **Status:** 🟢 Authored. The canonical architecture proposal and the reasoning behind each major decision. Decisions are recorded as ADRs in the [Decision Log](Decision_Log.md).

## Guiding principle

Everything is a **platform primitive, not a receptionist feature.** An AI Employee = persona + skills (tools) + knowledge base + channels + guardrails. The receptionist is one configuration of a general runtime. If receptionist-specific logic appears outside of configuration, that is an architecture bug.

## Layered architecture

```
┌──────────────────────────────────────────────────────────────┐
│  CHANNELS    Voice (Twilio)   SMS   Web chat   (future: email) │
├──────────────────────────────────────────────────────────────┤
│  RUNTIME     Voice Gateway  ·  Conversation Engine             │
│  (stateful)  turn-taking, barge-in, per-call session state     │
├──────────────────────────────────────────────────────────────┤
│  BRAIN       AI Orchestration Layer                            │
│              persona → planner → tool-calling → guardrails     │
│              ├── Knowledge Engine (RAG / pgvector)             │
│              ├── Skills / Tools (scheduling, CRM, lookup…)     │
│              └── Provider Adapters (OpenAI / others)           │
├──────────────────────────────────────────────────────────────┤
│  DOMAIN      Scheduling · Integrations · Analytics · Billing   │
├──────────────────────────────────────────────────────────────┤
│  PLATFORM    Multi-tenant Postgres · Redis · Queue · Auth      │
└──────────────────────────────────────────────────────────────┘
```

---

## Architecture proposal (with tradeoffs)

### Frontend

**Recommendation:** Next.js (App Router) + React + TypeScript + Tailwind + shadcn/ui + Framer Motion, deployed to Vercel. Server Components for data-heavy dashboard views; client components for interactive builder surfaces.
**Tradeoff:** Next.js couples us somewhat to Vercel's model, but the DX, edge network, and preview deployments are worth it for the web tier — and the _brain_ stays framework-free so we are not locked in where it matters.

### Backend

**Recommendation:** Two runtimes. (1) Next.js route handlers / tRPC on Vercel for request-scoped API and dashboard needs. (2) A long-running Node **voice-gateway** service for stateful telephony. Both stay **thin** and delegate to a shared **service layer** (`packages/services`) where use cases validate (`contracts`), authorize (`core`), and persist (`withTenant`); pure domain logic lives in framework-free packages (ADR-0010).
**Tradeoff:** two deploy targets add ops surface; the alternative (one monolith, or voice-on-serverless) either forfeits Vercel's DX or cannot hold call-length sockets. See ADR-0001.

### Database

**Recommendation:** PostgreSQL + Prisma, with **pgvector** for embeddings in the same database. Redis for sessions, rate limits, and a queue (BullMQ) for background work.
**Tradeoff:** Prisma's ergonomics vs. its weaker raw-SQL/RLS story — mitigated by a tenant-scoped client wrapper and hand-written RLS policies. pgvector keeps us to one datastore now; a dedicated vector DB remains an option behind the retrieval interface. See ADR-0004.

### Multi-tenant SaaS

**Recommendation:** Shared database, shared schema, **row-level tenancy**. The tenant is the `Organization`; every tenant row carries `organizationId`; Postgres RLS enforces isolation keyed on a per-transaction `app.tenant_id`; the raw Prisma client is never exported — all access goes through `withTenant(organizationId, fn)` (an interactive transaction that sets the RLS context on the same connection).
**Tradeoff:** shared-schema is the most operationally scalable for millions of small tenants but demands rigorous isolation; schema/DB-per-tenant would isolate more strongly but is operationally heavy at our scale. RLS gives us a hard backstop without that cost. See ADR-0003.

### Authentication

**Recommendation:** Clerk authenticates **users only** (login, sessions, MFA, later SAML/SCIM). **Postgres is the source of truth for Organizations, Memberships, Roles, and Permissions** (ADR-0009); Clerk users are mirrored into our `User` table via a signed webhook. Authorization is a deterministic `can(permissions, action)` check in `packages/core`, resolved from a member's role. Machine-to-machine calls (Twilio webhooks, gateway→API) use signed requests / service tokens, not user sessions.
**Tradeoff:** we build organization/membership management ourselves in exchange for full control of RBAC, no tenancy lock-in to Clerk's org feature/pricing, and a clean enterprise-provisioning path. See ADR-0009.

### AI orchestration layer

**Recommendation:** A framework-free `packages/ai` housing the planner/agent loop, a typed **Tool Registry** (Zod-validated, idempotent, permissioned per employee), guardrails (pre/post-flight), and **provider adapters** behind `VoiceProvider`/`LLMProvider`/`EmbeddingProvider`. Every turn is traced (prompt, retrieval, tool calls, latency, cost).
**Tradeoff:** an abstraction layer over providers costs some upfront design, but it is what lets us swap models and keep business logic provider-independent. See ADR-0002.

### Voice service

**Recommendation:** The `voice-gateway` bridges the Twilio Media Stream WebSocket and the AI provider socket, managing barge-in, silence timeouts, DTMF, and per-call Redis state, deployed near Twilio's media region. Ship v1 on the OpenAI Realtime API; keep the seam to fall back to a controllable STT→LLM→TTS pipeline where determinism matters.
**Tradeoff:** speech-to-speech is more natural but less controllable/observable than a pipeline; the provider abstraction lets us choose per flow rather than betting the company on one. See ADR-0002.

### Knowledge system

**Recommendation:** Ingest business docs/URLs/FAQs → chunk → embed → store in pgvector → tenant-scoped **hybrid retrieval** (vector + keyword) with re-ranking, injected into the prompt to ground every answer. Knowledge chunks are RLS-scoped so nothing bleeds across tenants.
**Tradeoff:** hybrid retrieval + re-ranking adds latency; caching and careful chunking keep it within budget. Grounding is what prevents the receptionist from inventing facts.

### Integration framework

**Recommendation:** A `Connector` interface (auth, capabilities, webhooks) with an encrypted per-tenant credential vault. Calendar first (Google), then CRM and messaging. Inbound and outbound webhooks are signed; inbound events are idempotent via `WebhookEvent`.
**Tradeoff:** a generic framework is more work than one-off integrations, but it is the only way to reach an integration marketplace without linear engineering cost per connector.

### Analytics system

**Recommendation:** Event-sourced. Domain events (`call.completed`, `appointment.booked`, `lead.qualified`) are recorded in the tenant-scoped **`EventLog`** (distinct from `AuditLog`, which is the security trail) and materialized into analytics tables that power per-tenant dashboards. Billing does **not** ride this stream — it has its own reconciled `UsageRecord` ledger (ADR-0008).
**Tradeoff:** event-sourcing adds indirection over direct table reads, but it decouples product analytics from billing and operational data and scales cleanly.

### Deployment strategy

**Recommendation:** `web` → Vercel (preview per PR). `voice-gateway` → container host (Fly.io/Railway/Render) with health checks and staged rollout. Managed Postgres with a session-context-preserving pooler (e.g. Neon). Secrets in a manager; migrations gated and reviewed; RLS policy changes require sign-off.
**Tradeoff:** multi-provider infra vs. a single PaaS; justified because no single platform serves both stateless web and stateful voice well.

---

## Monorepo structure (Turborepo + pnpm)

```
AI-Receptionist/
├── frontend/            # Next.js web app (Vercel)
├── backend/             # voice-gateway + long-running services
├── packages/
│   ├── core/            # pure domain logic (RBAC, errors, logging) — zero framework deps
│   ├── services/        # use-case/service layer: validate → authorize → persist (ADR-0010)
│   ├── contracts/       # shared Zod schemas + inferred API types
│   ├── ai/              # orchestration: planner, tool registry, provider adapters
│   ├── knowledge/       # ingestion, embeddings, retrieval
│   ├── integrations/    # connector framework + connectors
│   ├── ui/              # design system (tokens + shadcn/ui components)
│   └── config/          # shared TS/ESLint/Tailwind config
├── database/            # Prisma schema, migrations, tenant client, RLS policies
├── infrastructure/      # IaC, containers, env/region config
└── scripts/
```

**The rule that keeps this honest:** `core`, `ai`, and `knowledge` have _zero_ framework dependencies. They never import Next.js or Twilio. That is what makes every service replaceable.

## API strategy

Versioned from commit one (`/api/v1`). Internal app↔app via **tRPC** (end-to-end types); public/partner via **REST + OpenAPI**, both generated from the same Zod contracts in `packages/contracts`. Idempotency keys on all mutations; signed webhooks; per-tenant rate limiting. See [API Strategy](API_Strategy.md).

## Related

- [System Overview](System_Overview.md) · [Database Design](Database_Design.md) · [Decision Log](Decision_Log.md)
- [Security](Security.md) · [Scalability](Scalability.md) · [Voice Architecture](../04_AI/Voice_Architecture.md)
