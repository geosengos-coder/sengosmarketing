---
title: Decision Log
section: 03_Engineering
status: stable
owner: Engineering
created: 2026-07-11
last_updated: 2026-07-11
---

# Decision Log

> **Status:** 🟢 Active. Append-only record of architecture decisions (ADRs). Never rewrite history — supersede an ADR with a new one and link them.

Each entry: **Context** (the forces at play) · **Decision** · **Alternatives considered** · **Consequences**. The reasoning is the valuable part; capture it.

---

## ADR-0001 — Split the voice gateway off Vercel

**Status:** Accepted · 2026-07-11

**Context.** A live phone call is a long-lived, stateful, bidirectional WebSocket: Twilio Media Streams pushes ~20ms audio frames, we relay them to an AI provider socket and stream audio back for the full duration of the call, within a sub-second response budget. Vercel serverless/edge functions are request-scoped and time-boxed.

**Decision.** Deploy to **two targets**: `web` (Next.js on Vercel — dashboard, APIs, billing) and a long-running, containerized **`voice-gateway`** (Fly.io/Railway/Render) that owns telephony and AI-provider sockets and per-call state, deployed near Twilio's media region. They share the database and domain packages via the monorepo.

**Alternatives considered.**

- _Everything on Vercel_ — rejected; cannot hold call-length sockets reliably.
- _A single always-on monolith_ — rejected; forfeits Vercel's DX for the dashboard and couples stateless and stateful scaling.

**Consequences.** Two deploy pipelines and a network hop between web and gateway. In exchange: correct scaling, protected latency, and a clean stateless/stateful boundary. This is the load-bearing decision of the whole system.

---

## ADR-0002 — Voice provider abstraction, Realtime API first

**Status:** Accepted · 2026-07-11

**Context.** OpenAI's Realtime API gives excellent low-latency, interruptible speech-to-speech, but is a semi-opaque box: less turn-level control, harder logging, and provider lock-in. A receptionist must _reliably_ book appointments and never hallucinate a price — sometimes worth trading naturalness for control. We also stated a goal of multi-provider support.

**Decision.** Define `VoiceProvider`, `LLMProvider`, and `EmbeddingProvider` interfaces now. Ship v1 on the Realtime API for speed and quality, but keep the seam so we can drop to a controllable pipeline (e.g. Deepgram STT → our orchestrator → ElevenLabs/Cartesia TTS) per tenant or per flow. Business logic lives in **our** orchestration layer regardless of the underlying voice provider.

**Alternatives considered.**

- _Commit fully to the Realtime API_ — rejected; lock-in and weak determinism for regulated flows.
- _Build the STT→LLM→TTS pipeline first_ — rejected for v1; slower to a great-sounding demo and more moving parts before product-market signal.

**Consequences.** A small abstraction cost up front; freedom to swap providers and run deterministic pipelines later without touching business logic.

---

## ADR-0003 — Enforce tenant isolation with RLS, not just app code

**Status:** Accepted · 2026-07-11

**Context.** At "millions of businesses," relying only on application-level `where: { businessId }` is one forgotten clause away from a cross-tenant data leak. Prisma's native RLS support is weak.

**Decision.** Every tenant-owned table carries an indexed `businessId` and enables **Postgres Row-Level Security** keyed on a per-transaction `app.tenant_id`. All access goes through a `forTenant(businessId)` Prisma wrapper that issues `SET LOCAL app.tenant_id`; the raw client is never exported. A dedicated integration test suite proves cross-tenant isolation and gates CI.

**Alternatives considered.**

- _App-level scoping only_ — rejected; too easy to bypass, catastrophic failure mode.
- _Schema-per-tenant / database-per-tenant_ — rejected at this scale; operationally heavy for millions of small tenants.

**Consequences.** A pooler that preserves session context is required (Neon, or PgBouncer/Accelerate in transaction mode, handled carefully). In exchange, isolation is a hard database guarantee, not a discipline.

---

## ADR-0004 — pgvector in Postgres over a separate vector DB

**Status:** Accepted · 2026-07-11

**Context.** The Knowledge Engine needs vector similarity search over per-tenant content to ground answers. A separate vector database adds a system to operate, secure, and keep tenant-isolated.

**Decision.** Store embeddings in **pgvector** inside the primary Postgres. Knowledge chunks carry `businessId` and inherit the same RLS isolation as everything else. Use hybrid search (vector + keyword) with re-ranking.

**Alternatives considered.**

- _Dedicated vector DB (Pinecone/Weaviate/etc.)_ — deferred; revisit only when scale or recall demands it.

**Consequences.** One fewer system to run and secure, and tenant isolation for knowledge comes for free from existing RLS. Migration path remains open behind the retrieval interface.

---

## ADR-0005 — Turborepo monorepo with framework-free core packages

**Status:** Accepted · 2026-07-11

**Context.** `web` and `voice-gateway` must share the data model and domain/AI logic without duplication, and we want every service to be replaceable.

**Decision.** A Turborepo + pnpm monorepo. Domain, orchestration, and knowledge logic live in `packages/core`, `packages/ai`, `packages/knowledge` with **zero framework dependencies** — they never import Next.js or Twilio. Apps and adapters depend on them, not the reverse.

**Alternatives considered.**

- _Polyrepo_ — rejected; painful schema/logic sharing across the two deploy targets.
- _Logic living inside the Next.js app_ — rejected; couples the brain to a framework and to Vercel.

**Consequences.** Slightly more upfront structure; in return, the brain is portable and testable in isolation, honoring the platform principle.

---

## ADR-0006 — Documentation folder & naming convention (underscore, numbered sections)

**Status:** Accepted · 2026-07-11

**Context.** Two doc conventions were in play (space-separated vs. underscore filenames). Links, tooling, and shell ergonomics all suffer from spaces in paths; a consistent convention avoids duplicate/divergent trees.

**Decision.** Documentation lives under `docs/` in seven numbered sections (`01_Founder_Bible` … `07_Marketing`) with **underscore-separated filenames** (`Product_Philosophy.md`). The project root folder is `AI-Receptionist` (no spaces). The earlier space-named tree was migrated to this convention; authored flagship content (Vision, Architecture, Database Design, Decision Log) was preserved.

**Alternatives considered.**

- _Space-separated names_ — rejected; break shell/git tooling and require URL-encoding in links.
- _kebab-case_ — viable, but the founder's spec standardized on underscores.

**Consequences.** All cross-links use underscore paths. Some earlier stub docs outside the new spec (e.g. Coding_Standards, Infrastructure, Deployment, Technical_Debt, Core_Values, and several 04_AI stubs) were dropped to match the canonical list; they can be re-added when needed.

---

## ADR-0007 — Buy (don't build) the voice media layer initially

**Status:** Accepted · 2026-07-11

**Context.** A live phone call requires real-time media plumbing: WebRTC/SIP handling, jitter buffering, voice-activity detection (VAD), **barge-in / interruption**, endpointing, echo handling, and the bridging of a telephony media stream to an AI model socket within a sub-second budget. This is a deep, specialized domain. Building it from raw Twilio Media Streams is measured in engineer-years and is _not_ where our differentiation lives — our value is the Business Brain (knowledge, reasoning, guardrails, integrations), not the audio transport. Meanwhile, mature platforms already solve the media layer and are improving faster than we could alone.

**Decision.** **Do not build the voice media/orchestration layer ourselves for v1.** Adopt an existing real-time voice-agent platform behind our `VoiceProvider` interface (see ADR-0002), and keep our differentiated logic (orchestration, tools, guardrails, knowledge) in our own framework-free packages. The `voice-gateway` service becomes a thin, owned integration + policy layer around the chosen provider, not a from-scratch media engine.

**Recommended providers (evaluate in this order).**

- **LiveKit (Agents)** — open-source core with managed cloud; strong WebRTC foundation, self-host escape hatch, good for owning more over time. _Preferred primary_ for its portability.
- **Pipecat** — open-source Python framework for voice agents; maximal control of the STT→LLM→TTS pipeline, aligns with the cost/control path in ADR-0002.
- **Vapi / Retell** — fully-managed voice-agent APIs; fastest path to a great-sounding MVP, least infrastructure to run, higher per-minute cost and more lock-in.
- **OpenAI Realtime API** — remains a valid _model/voice_ provider behind the platform for speech-to-speech turns; not a substitute for the media/telephony orchestration.

Selection criteria: telephony (Twilio SIP) interop, barge-in quality, measured p95 turn latency, per-minute cost, self-host/portability, and observability hooks.

**VoiceProvider abstraction strategy.** All providers sit behind one interface with a stable contract: _start/stop session, stream inbound audio, emit transcript + turn events, invoke our tool-calling hook, stream outbound audio, surface latency/cost telemetry._ Business logic never imports a provider SDK directly. This lets us run different providers per tenant or per flow, and A/B them on quality, latency, and cost.

**Future migration path.** Start managed (fastest MVP) → move to **LiveKit self-host / Pipecat** as volume makes per-minute cost and control dominate → optionally build bespoke components (custom VAD, endpointing, or media routing) _only_ where measurement proves the platform is the bottleneck. Because differentiated logic lives above the interface, each step is an adapter swap, not a rewrite.

**Alternatives considered.**

- _Build media infra from Twilio Media Streams now_ — rejected for v1; years of undifferentiated work, worse reliability than incumbents, and it delays the parts that actually matter.
- _Marry a single managed API (e.g. Vapi) with no abstraction_ — rejected; fast but locks in pricing and caps our control over latency and cost at scale.

**Consequences.** Dramatically faster, more reliable MVP and less telco plumbing to operate. In exchange: a per-minute platform cost and a dependency to abstract and monitor. The `VoiceProvider` seam (ADR-0002) is now load-bearing and must be honored without exception. Provider evaluation itself becomes an early Phase-4 task with explicit latency/cost benchmarks. Reinforces the cost architecture called out in [Risk Register](Risk_Register.md) R-03.

---

## ADR-0008 — Separate the billing ledger from the analytics pipeline

**Status:** Accepted · 2026-07-11

**Context.** An earlier draft stated "the same events drive Stripe metered billing" from the analytics stream. Billing and analytics have **opposite correctness requirements**. Billing must be exactly-once, auditable, reconcilable, and durable — a dropped or duplicated event is a _revenue error_ and a trust breach. Analytics tolerates loss, reordering, sampling, and reprocessing. Coupling them means the lossy system can corrupt money.

**Decision.** Maintain **two distinct systems** fed by the same domain events but with independent guarantees.

1. **Billing ledger** — an append-only, immutable record of billable usage (call minutes, resolved calls, per-tenant metering) written transactionally with the work that produced it, assigned an idempotency key, and **reconciled against the provider of record** (Twilio/voice-platform usage, Stripe) before invoicing. This is the source of truth for money.
2. **Analytics pipeline** — a separate event stream feeding per-tenant dashboards and internal metrics; optimized for volume and flexibility, explicitly _not_ trusted for billing.

**Why they must be separate.**

- **Correctness:** exactly-once + auditable (billing) vs. at-least-once/lossy + reprocessable (analytics).
- **Reconciliation:** billing must tie out to external systems of record; analytics does not.
- **Blast radius:** an analytics outage must never stop or distort billing, and vice-versa.
- **Compliance/audit:** billing is a financial record with retention and audit obligations analytics does not carry.

**Data ownership.** The **billing ledger** owns billable-usage truth (`UsageRecord` becomes an immutable ledger entry, not a mutable counter) and is owned by the platform/payments domain. The **analytics store** owns product/behavioral metrics and is owned by the product/data domain. Dashboards may _read_ billing figures but never _write_ them.

**Usage-tracking architecture.** At each billable event (e.g. call end), the runtime writes a ledger entry transactionally, keyed for idempotency, tagged with tenant, metric, quantity, and period. A periodic **reconciliation job** compares our ledger to provider-reported usage and flags drift before Stripe is invoiced. The same event is _also_ emitted (fire-and-forget) to analytics — but analytics failure has no billing consequence.

**Future pricing flexibility.** An immutable, granular ledger lets us re-derive charges under new pricing models (per-minute, per-resolved-call, per-booking, seat + usage hybrids, tiered overages) without schema surgery, run pricing experiments, issue accurate credits/refunds, and support enterprise custom contracts — because the raw usage facts are preserved independently of how we currently price them.

**Alternatives considered.**

- _Single event stream for both_ — rejected; makes revenue depend on a lossy system.
- _Bill directly from provider invoices only_ — rejected; loses per-tenant/per-employee granularity and our own margin visibility; we still reconcile _against_ providers but keep our own ledger.

**Consequences.** Slightly more infrastructure (a durable ledger + a reconciliation job) and disciplined idempotency at billable boundaries. In exchange: trustworthy revenue, clean audits, and pricing agility. Ties to [Risk Register](Risk_Register.md) R-06.

---

## ADR-0009 — DB-authoritative organizations; Clerk for authentication only

**Status:** Accepted · 2026-07-11

**Context.** An earlier phrasing said "Clerk Organizations = tenants," implying Clerk owns orgs, membership, and roles. Phase 0 requires Organizations, Members, Roles, and Permissions as first-class entities with custom RBAC and an enterprise path (SAML/SCIM later). Coupling core tenancy to Clerk's organization feature would constrain our RBAC to Clerk's role model, tie tenancy to Clerk's pricing tiers, and make custom fine-grained permissions and any future migration awkward.

**Decision.** **Postgres is the source of truth for Organizations, Memberships, Roles, and Permissions.** Clerk is the identity provider for **users only** (login, sessions, MFA, and later SAML/SCIM). Clerk users are mirrored into our `User` table via a signed webhook; all organization, membership, and authorization data lives in our database and is enforced by RLS (ADR-0003). Authorization is a deterministic `can(permissions, action)` check resolved from a member's role.

**Alternatives considered.**

- _Clerk Organizations as source of truth (mirrored to DB)_ — rejected; couples tenancy/RBAC to a vendor feature and its pricing, constrains custom permissions, harder to migrate.
- _Hybrid (Clerk owns orgs; DB owns a separate permission layer)_ — rejected; two sources of truth for authorization, sync edge cases.

**Consequences.** We build organization/membership management ourselves (more code) in exchange for full control of RBAC, no tenancy lock-in, and a clean enterprise-provisioning path into our own model. Phase 0 ships **system roles** (owner/admin/member) as global seed data; the schema's nullable `Role.organizationId` leaves room for per-organization custom roles later. Supersedes the "Clerk Organizations = tenants" wording in earlier drafts of Architecture.md.

---

## ADR-0010 — Layered backend: thin routes over a service layer

**Status:** Accepted · 2026-07-12

**Context.** "Avoid business logic in routes" requires a home for that logic. `packages/core` is framework-free and must not import Prisma, so it cannot host use cases that touch the database. We need a layer that orchestrates the data layer (`@operatoros/database`), pure domain rules (`@operatoros/core`), and validation (`@operatoros/contracts`), callable from both the web app and the voice-gateway.

**Decision.** Introduce **`packages/services`** — the use-case/service layer. Responsibilities: input validation (via `@operatoros/contracts` Zod schemas), authorization (`can()` from core), tenant-scoped data access (`withTenant`), domain errors (from `@operatoros/core`), and structured logging. **Routes/handlers stay thin**: parse → call a service → map the result/error to a response. Also add **`packages/contracts`** (shared Zod schemas + inferred types) and **`packages/ui`** (design-system tokens + primitives), both already anticipated in the architecture.

Layering (dependencies point downward):

```
frontend / backend        (thin: HTTP, React; no business logic)
        │
   packages/services       (use cases: validate → authorize → persist)
     ├── packages/contracts (Zod schemas + types)
     ├── packages/database  (withTenant / withSystem; RLS)
     └── packages/core      (pure domain: RBAC, errors, logging — zero deps)
```

**Alternatives considered.**

- _Business logic in route handlers_ — rejected; untestable, duplicated across web/gateway, couples domain to the framework.
- _Everything in `core`_ — rejected; core must stay framework/DB-free to remain portable and unit-testable.
- _Full hexagonal/repository abstraction now_ — deferred; services calling `withTenant` directly is enough at this stage. Repository interfaces can be introduced later behind the service API without changing callers.

**Consequences.** One more layer to pass through, in exchange for testable, reusable business logic and a clean thin-route rule enforceable in review. Errors are defined once in `core` and mapped to HTTP at the edge. This layering is the standard for all future feature work.

---

_Template for new entries:_

```
## ADR-XXXX — <short title>
**Status:** Proposed | Accepted | Superseded by ADR-YYYY · <date>
**Context.**
**Decision.**
**Alternatives considered.**
**Consequences.**
```
