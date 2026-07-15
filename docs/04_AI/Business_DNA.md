---
title: Business DNA
section: 04_AI
status: stable
owner: Engineering / AI
created: 2026-07-12
last_updated: 2026-07-12
---

# Business DNA

> **Status:** 🟢 Authored + built (`@operatoros/dna`). The structured specification that defines how an AI Employee behaves — core IP ([ADR-0015](../03_Engineering/Decision_Log.md#adr-0015--business-dna-the-structured-spec-every-ai-employee-consumes)). Not a prompt generator: a versioned, validated, layered document that drives behavior across every dimension. Related: [Business Brain](Business_Brain.md) (the per-tenant knowledge concept this formalizes) and the [Business Brain visualization](../05_Design/Business_Brain_Rendering_Architecture.md) (which _renders_ a DNA assembling).

## The idea

Behavior is **data, not a prompt.** A business's AI Employees are defined by a Business DNA document. A system prompt is only _one artifact_ derived from it; the same DNA also produces the tool allow-list, policy guardrails, escalation config, scheduling behavior, and metric targets. This is what lets the platform scale to thousands of businesses and many employee types without hand-tuning prompts.

## Two layers → many employees

```
BusinessDNA
├── business (shared)      identity · knowledge · policies · scheduling · integrations · industryBehavior · brandVoice
└── employees[] (per role) personality · communication · tools · escalation · customerExperience · successMetrics
```

One **business layer** feeds many **employee blueprints**. The same business resolves into a receptionist, a scheduler, a sales agent, a support agent, or a website concierge — each a role-specific behavior derived from the shared business context.

## The twelve dimensions

| Dimension                  | Where it lives                | What it controls                                                      |
| -------------------------- | ----------------------------- | --------------------------------------------------------------------- |
| Business identity          | `business.identity`           | Who the business is, where, hours, languages                          |
| Knowledge model            | `business.knowledge`          | Services, FAQs, facts, retrieval sources, coverage                    |
| Communication style        | `employee.communication`      | Tone, formality, verbosity, greeting, channels                        |
| Personality                | `employee.personality`        | Archetype + warmth/assertiveness/humor/empathy dials                  |
| Policies                   | `business.policies`           | Cancellation/refund/compliance, can/cannot promise, prohibited topics |
| Scheduling behavior        | `business.scheduling`         | Appointment types, buffers, reminders, notice, confirmation           |
| Tool permissions           | `employee.tools`              | Which platform tools the employee may call, with constraints          |
| Escalation logic           | `employee.escalation`         | Triggers → actions, fallback, human handoff                           |
| Industry-specific behavior | `business.industryBehavior`   | Vocabulary, common intents, sector rules                              |
| Integrations               | `business.integrations`       | Connected systems and how the employee uses them                      |
| Customer experience        | `employee.customerExperience` | Objectives, upsell posture, follow-up, CSAT target                    |
| Success metrics            | `employee.successMetrics`     | What the employee optimizes for, with targets                         |

## The pipeline

```
BusinessInput ──analyze()──▶ BusinessSignals ──resolveBusinessDNA()──▶ BusinessDNA ──toRuntime(role)──▶ RuntimeContract
(url,name,           (identity + services +      (IndustryTemplate ⊕            (validated,           (prompt + toolAllowlist +
 industry,city)       website analysis)           Signals ⊕ RoleTemplate)       versioned)            policies + escalation + …)
```

1. **Generate** — `BusinessDNAGenerator.analyze()` turns inputs into `BusinessSignals`, including the strengths/weaknesses/SEO/conversion **website analysis** ([ADR-0014](../03_Engineering/Decision_Log.md#adr-0014--the-website-blueprint-is-a-real-personalized-analysis)). Provider-agnostic: a deterministic `HeuristicGenerator` ships now; an LLM/site-analysis generator plugs in behind the same interface when keys land.
2. **Resolve** — `resolveBusinessDNA()` composes an industry template (defaults), the signals, and role templates into a **validated** DNA. Pure and deterministic → testable at scale. Industry rules apply automatically (e.g. dental → HIPAA + a compliance-escalation trigger with zero extra config).
3. **Consume** — `toRuntime(dna, role)` yields the `RuntimeContract` the AI orchestrator runs: `systemPrompt` **and** `toolAllowlist`, `toolConstraints`, `policies`, `escalation`, `scheduling`, `metrics`.

## Why it scales and stays easy to configure

- **Templates carry the defaults.** Industry + role templates mean a business is configurable with almost no input; a business overrides only what's specific to it.
- **Validated + versioned.** `schemaVersion` + Zod validation; the schema evolves without breaking consumers.
- **Deterministic + pure.** No side effects in resolution → safe to run for thousands of tenants and trivial to unit-test.
- **Multi-employee by construction.** New employee types are new role templates, not new engines.
- **Provider-agnostic generation.** The magic step (analysis) is swappable; the rest is stable.

## How it connects to the rest of OperatorOS

- **Marketing (Movement 3):** the personalization moment renders a DNA being generated and resolved live — the same engine, feeding the Business Brain visualization as it assembles.
- **Product:** a resolved employee blueprint persists on `AIEmployeeConfiguration`; the dashboard's employee builder edits the DNA.
- **Runtime:** the orchestrator consumes the `RuntimeContract`; tool grants map to the Tool Registry; escalation maps to guardrails ([Security](../03_Engineering/Security.md) §2).

## Packages

- **`@operatoros/dna`** — the spec + resolution: `schema.ts`, `industries.ts` / `roles.ts` (templates), `generate.ts` (the seam + `HeuristicGenerator`), `resolve.ts` (composition), `runtime.ts` (the consumer contract). Framework-free, zero I/O.
- **`@operatoros/ai`** — the real generator ([ADR-0016](../03_Engineering/Decision_Log.md#adr-0016--business-dna-generation-multi-source-ingestion--llm-analysis-behind-the-provider-seam)): the `LLMProvider` seam + `OpenAIProvider`, SSRF-safe website fetch, multi-source collectors, the LLM analyzer, and `LLMBusinessDNAGenerator`. One call — `generateBusinessDNA(input, opts)` — takes inputs → validated `BusinessDNA`, real when a key exists and heuristic otherwise.

Verified: both packages typecheck clean; unit tests green (resolution + generator fallback).

### The real generation pipeline (`@operatoros/ai`)

```
BusinessInput ─▶ collectSources() ─▶ [metadata, website(SSRF-safe), documents, faqs, reviews, …]
                                          │
                                          ▼
                              analyzeToSignals()  (LLMProvider → BusinessSignalsSchema.parse)
                                          │        └─ on any failure ─▶ HeuristicGenerator
                                          ▼
                              resolveBusinessDNA()  ─▶  BusinessDNA
```

Adding a source (a reviews API, a CRM export, a future integration) means adding a collector — the analyzer and the DNA contract are untouched.

## Open questions

- Persistence shape on `AIEmployeeConfiguration` (store resolved DNA vs. inputs + regenerate).
- Versioned migrations when the schema evolves (upgrade path for stored DNA).
- Confidence/coverage surfacing in the product (what the AI doesn't yet know).

## Related

- [ADR-0015](../03_Engineering/Decision_Log.md#adr-0015--business-dna-the-structured-spec-every-ai-employee-consumes) · [ADR-0014](../03_Engineering/Decision_Log.md#adr-0014--the-website-blueprint-is-a-real-personalized-analysis) · [Business Brain](Business_Brain.md) · [Guardrails](Guardrails.md) · [Flagship Creative Direction](../05_Design/Flagship_Experience_Creative_Direction.md)
