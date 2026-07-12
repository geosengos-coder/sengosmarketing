<div align="center">

# OperatorOS

**The operating system for AI Employees.**

_The first AI employee is a Receptionist. The platform is built for a future where any business can run unlimited AI employees on a shared foundation._

</div>

---

## What this is

OperatorOS is a multi-tenant platform for creating, configuring, and running **AI Employees** — AI agents that answer calls, book appointments, qualify leads, and communicate naturally with a business's customers.

The core insight that shapes every decision here: **an AI Employee is a configuration, not a codebase.** A receptionist is a persona + a set of skills (tools) + a knowledge base + a set of channels (voice/SMS/chat) + guardrails. Building the second employee should mean adding rows and tools, not forking the engine.

## Repository map

| Path                                 | What lives here                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| [`docs/`](docs/)                     | **The source of truth.** Vision, product, engineering, AI, design, integrations, marketing. Read this first. |
| [`frontend/`](frontend/)             | Next.js dashboard, onboarding, and marketing surfaces (deployed to Vercel).                                  |
| [`backend/`](backend/)               | Long-running services that can't run serverless — chiefly the **voice gateway**.                             |
| [`packages/`](packages/)             | Shared, framework-agnostic packages (`core`, `ai`, `knowledge`, `integrations`, `ui`, `contracts`).          |
| [`database/`](database/)             | Prisma schema, migrations, tenant-scoped client, and Row-Level Security policies.                            |
| [`infrastructure/`](infrastructure/) | IaC, containers, environment and region configuration.                                                       |
| [`scripts/`](scripts/)               | Developer and operational tooling.                                                                           |
| [`.github/`](.github/)               | PR/issue templates, CODEOWNERS, CI.                                                                          |

## The one architectural fact to internalize

The system deploys to **two targets**, not one:

- **Web (Vercel):** dashboard, APIs, onboarding, billing — request-scoped, stateless.
- **Voice gateway (containerized, long-running):** holds the Twilio Media Stream and AI provider WebSockets open for the _entire duration of a call_, with a sub-second response budget. This **cannot** run on Vercel serverless.

Everything else follows from taking real-time voice seriously. See [Architecture](docs/03_Engineering/Architecture.md) and [ADR-0001](docs/03_Engineering/Decision_Log.md).

## Technology stack

**Frontend:** Next.js · React · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion
**Backend:** Next.js App Router (web APIs) · long-running Node voice gateway · PostgreSQL · Prisma · Redis
**Auth:** Clerk (Organizations = tenants) · **Payments:** Stripe (metered usage) · **Phone:** Twilio
**AI:** OpenAI Realtime API first, behind a provider abstraction for multi-provider support
**Deploy:** Vercel (web) + container host (voice gateway) · **VCS:** GitHub

## How we work: Doc-Driven Development

Documentation is not an afterthought here — **it drives development.** No major feature is coded before its documentation exists. Every architecture decision is recorded. See the [Documentation Index](docs/README.md) for the full workflow and rules.

## Status

🟢 **Phase 0 — Foundations.** Repository and documentation scaffold established. No application features implemented yet. See the [Roadmap](docs/01_Founder_Bible/Roadmap.md).
