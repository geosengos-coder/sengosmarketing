---
title: Roadmap
section: 01_Founder_Bible
status: stable
owner: Founders / Engineering
created: 2026-07-11
last_updated: 2026-07-11
---

# Roadmap

> **Status:** 🟢 Authored. The phased plan from foundation to production launch. Update this in the same change that alters scope or sequence (see [Doc-Driven Development](../README.md#doc-driven-development)).

## Principles

- **Each phase ships something demonstrable** and de-risks the next.
- **Documentation leads each phase** — specs before code.
- **The platform is built as primitives**; the receptionist is the first configuration, not a fork.

## Phases

### Phase 0 — Foundation _(current)_

Repository, documentation system, architecture, and decision framework. Monorepo scaffolding, `CLAUDE.md`, ADRs. **No product features.**
**Exit:** a new engineer can understand the product and architecture from the docs alone; the repo skeleton and standards are in place.

### Phase 1 — Website + Brand Experience

The public face: marketing site, brand, and design-system foundation (tokens, typography, motion). Establishes the visual language every later surface inherits.
**Exit:** a live, on-brand marketing site; design tokens and core UI primitives usable by the dashboard.

### Phase 2 — Business Dashboard

Authenticated multi-tenant app shell: Clerk orgs = tenants, tenant-scoped data access with RLS, navigation, settings, billing surface. No AI yet — this is the container AI employees will live in.
**Exit:** a business can sign up, create an org, invite teammates, and manage account/billing; tenant isolation is proven by tests.

### Phase 3 — AI Employee Builder

The configuration surface that makes an AI employee a _configuration, not code_: persona, skills (tools), knowledge upload, guardrails, channels. Backed by the Employee/Skill/Guardrail/Knowledge data model.
**Exit:** a business can create and configure a (not-yet-live) AI employee end to end in the dashboard.

### Phase 4 — Voice Receptionist MVP

The stateful `voice-gateway`: Twilio inbound → OpenAI Realtime API → grounded answers from the Knowledge Engine → full transcript/logging. The first employee comes alive on the phone.
**Exit:** a real phone number answered by a configured AI receptionist that converses naturally and answers business questions, within the latency budget.

### Phase 5 — Scheduling + Integrations

The `book_appointment` skill against a provider-abstracted calendar (Google first), idempotent hold/confirm, and the connector framework. The receptionist stops talking and starts _doing_.
**Exit:** the receptionist books real appointments into a connected calendar without double-booking; first CRM/messaging connectors live.

### Phase 6 — Analytics

Event-sourced domain events materialized into per-tenant dashboards (call volume, containment, booking conversion, lead quality, latency, cost). Same events drive Stripe metered billing.
**Exit:** businesses can see the value delivered; usage-based billing is accurate.

### Phase 7 — Production Launch

Hardening: security review, load testing to the concurrency target, on-call/observability, SLAs, docs, pricing, and go-to-market execution.
**Exit:** generally available, billable, and operable at scale.

## Sequencing rationale

Brand and dashboard precede the AI so that when voice comes alive there is a real product around it (not a demo). The Builder precedes the voice MVP so the receptionist is _configured_, not hardcoded — proving the platform thesis before we scale it. Scheduling follows the conversational MVP because "books the appointment" is the outcome that converts trials to revenue.

## Related

- [Architecture](../03_Engineering/Architecture.md) · [Decision Log](../03_Engineering/Decision_Log.md)
- [AI Receptionist](../02_Product/AI_Receptionist.md) · [Feature Specifications](../02_Product/Feature_Specifications.md)
