---
title: Risk Register
section: 03_Engineering
status: stable
owner: Engineering / Founders
created: 2026-07-11
last_updated: 2026-07-11
---

# Risk Register

> **Status:** 🟢 Active. The living record of material technical, product, and business risks. Review at each phase gate; update when a risk changes state. Severity/Probability are qualitative (Low / Medium / High / Critical). "Owner" is a role until staffed.

## How to read this

- **Severity** = how bad if it materializes. **Probability** = likelihood without further mitigation. **Impact** = the concrete consequence.
- **Decision** = _Fix now_ (address in docs/design before/at Phase 0–4), _Mitigate_ (build controls on the roadmap), or _Accept_ (consciously tolerate for now, revisit at a named trigger).
- Cross-referenced from [Security](Security.md), [Decision Log](Decision_Log.md), and [Architecture](Architecture.md).

## Summary

| ID   | Risk                                                     | Severity | Prob. | Owner             | Decision          |
| ---- | -------------------------------------------------------- | -------- | ----- | ----------------- | ----------------- |
| R-01 | Compliance not foundational (HIPAA/SOC2/consent/TCPA)    | Critical | High  | Founders/Security | Fix now           |
| R-02 | Stateful voice-gateway reliability & failover            | Critical | High  | Eng (Platform)    | Fix now (design)  |
| R-03 | Voice AI unit economics / COGS & margin                  | High     | High  | Founders/Eng      | Fix now (model)   |
| R-04 | Build-vs-buy voice media layer                           | High     | Med   | Eng (AI/Voice)    | Fixed — ADR-0007  |
| R-05 | Prompt injection & AI manipulation                       | Critical | High  | Security/AI       | Fix now (design)  |
| R-06 | Billing coupled to lossy analytics                       | High     | Med   | Eng (Platform)    | Fixed — ADR-0008  |
| R-07 | Real-time agent-loop latency vs. control                 | High     | High  | Eng (AI/Voice)    | Mitigate          |
| R-08 | Single-Postgres scaling & data residency                 | High     | Med   | Eng (Platform)    | Mitigate          |
| R-09 | Distributed booking correctness                          | High     | Med   | Eng (Domain)      | Fix now (design)  |
| R-10 | Voice quality evaluation harness                         | High     | High  | Eng (AI)          | Mitigate          |
| R-11 | Latency budget unengineered                              | Med      | High  | Eng (Voice)       | Mitigate          |
| R-12 | Observability / SLOs / on-call maturity                  | Med      | Med   | Eng (Platform)    | Mitigate          |
| R-13 | Vendor concentration (Twilio/OpenAI/Clerk/Vercel/Stripe) | High     | Med   | Eng/Founders      | Accept + abstract |

---

## R-01 — Compliance is not treated as foundational

- **Description:** HIPAA (medical/dental tenants handle PHI), SOC 2 (required to sell mid-market), call-recording consent by jurisdiction, TCPA, GDPR/CCPA are currently footnotes, not architecture.
- **Severity:** Critical · **Probability:** High
- **Impact:** Blocks the healthcare market and enterprise sales; retrofitting compliance into the data model/provider choices later is expensive and may force re-architecture; legal/regulatory exposure.
- **Owner:** Founders / Security
- **Decision:** **Fix now.**
- **Mitigation:** Author `Compliance.md` and a data-classification model (PHI/PII/payment/general) before Phase 4; require BAAs with all PHI subprocessors behind the provider seams; begin SOC 2 control design in Phase 0; make consent state a first-class field on recordings. Captured in [Security](Security.md) §5, §7.

## R-02 — Stateful voice-gateway reliability & failover

- **Description:** Live calls are call-length WebSockets. Instance death drops calls; deploys can't kill pods holding live calls; Twilio is a single carrier dependency. Earlier "resumable" claim was overstated — a broken media stream cannot be seamlessly resumed.
- **Severity:** Critical · **Probability:** High
- **Impact:** Dropped customer calls = direct lost revenue for the business we serve; our reliability bar is telco-grade, not dashboard-grade.
- **Owner:** Engineering (Platform)
- **Decision:** **Fix now (design).**
- **Mitigation:** Design connection-draining / blue-green that waits out in-flight calls; graceful call-failure handling (apologize + fallback to voicemail/human) instead of pretending to resume; concurrent-call capacity planning + autoscaling for sticky sockets; evaluate multi-carrier failover (partly addressed by ADR-0007's platform choice). Document in `Voice_Architecture.md` before Phase 4.

## R-03 — Voice AI unit economics / COGS

- **Description:** Speech-to-speech per-minute cost is high; no cost-control architecture (model routing, caching, per-tenant cost metering) exists. Margin is dominated by AI + telephony spend.
- **Severity:** High · **Probability:** High
- **Impact:** Negative or thin gross margin at scale; pricing that can't cover COGS; forced re-architecture under margin pressure.
- **Owner:** Founders / Engineering
- **Decision:** **Fix now (model).**
- **Mitigation:** Build a COGS-per-call model; adopt model routing (cheap model for simple turns, premium only when needed); caching; treat "cost per resolved call" as a first-class SLO. Strengthens the pipeline option in ADR-0002 and the provider choice in ADR-0007.

## R-04 — Build-vs-buy the voice media layer

- **Description:** Building WebRTC/media plumbing, VAD, barge-in from scratch is years of undifferentiated work.
- **Severity:** High · **Probability:** Medium
- **Impact:** Delays MVP by quarters; worse reliability than incumbents; opportunity cost against the Business Brain (our real differentiation).
- **Owner:** Engineering (AI/Voice)
- **Decision:** **Fixed — see [ADR-0007](Decision_Log.md#adr-0007--buy-dont-build-the-voice-media-layer-initially).**
- **Mitigation:** Adopt LiveKit/Pipecat/Vapi behind `VoiceProvider`; owned logic stays above the seam; migration path defined.

## R-05 — Prompt injection & AI manipulation

- **Description:** Caller speech and uploaded knowledge/integration data are attacker-controllable inputs that can socially-engineer the model into leaking data or misusing tools.
- **Severity:** Critical · **Probability:** High
- **Impact:** Unauthorized actions (booking/cancelling/messaging), data leakage across contexts/tenants, reputational and legal harm. Safety-critical because the system takes real actions.
- **Owner:** Security / AI
- **Decision:** **Fix now (design).**
- **Mitigation:** Treat the model as an untrusted planner; deterministic tool authorization outside the prompt; trust-separated prompt construction; input screening at ingestion and runtime; post-flight output validation; standing red-team suite gating releases. Fully specified in [Security](Security.md) §1–§3.

## R-06 — Billing coupled to lossy analytics

- **Description:** Earlier design fed billing from the analytics stream, where a dropped event = revenue error.
- **Severity:** High · **Probability:** Medium
- **Impact:** Incorrect invoices, revenue leakage, failed audits, customer trust damage.
- **Owner:** Engineering (Platform)
- **Decision:** **Fixed — see [ADR-0008](Decision_Log.md#adr-0008--separate-the-billing-ledger-from-the-analytics-pipeline).**
- **Mitigation:** Immutable, reconciled billing ledger separate from analytics; idempotency at billable boundaries; reconciliation against provider of record.

## R-07 — Real-time agent-loop latency vs. control

- **Description:** A full planner→tool-calling loop inside a sub-second turn adds round-trips; tension between the provider's native function-calling (fast, bypasses guardrails) and intercepting in our layer (controllable, slower).
- **Severity:** High · **Probability:** High
- **Impact:** Sluggish or unnatural conversation, or fast-but-ungoverned actions.
- **Owner:** Engineering (AI/Voice)
- **Decision:** **Mitigate.**
- **Mitigation:** Latency-masking (filler speech / "let me check that"), speculative execution, and an explicit rule for which turns run native vs. orchestrated; benchmark both. Document in `Prompt_Architecture.md` / `Conversation_Engine.md`.

## R-08 — Single-Postgres scaling & data residency

- **Description:** One Postgres holding OLTP + massive append-only message/recording logs + pgvector will bottleneck; no EU residency story; pgvector degrades before "billions of chunks."
- **Severity:** High · **Probability:** Medium
- **Impact:** Performance cliffs, costly emergency migration, inability to serve EU/enterprise residency requirements.
- **Owner:** Engineering (Platform)
- **Decision:** **Mitigate.**
- **Mitigation:** Separate hot OLTP from cold conversation/recording logs (object storage + OLAP); plan partitioning/sharding by tenant; keep the retrieval interface clean so a dedicated vector store swap is an adapter change; add a data-residency plan before enterprise/EU. Revisit ADR-0004 trigger.

## R-09 — Distributed booking correctness

- **Description:** Our DB and Google Calendar aren't one transaction; concurrent calls can race for the last slot.
- **Severity:** High · **Probability:** Medium
- **Impact:** Double-booking — one of the two unforgivable product failures.
- **Owner:** Engineering (Domain)
- **Decision:** **Fix now (design).**
- **Mitigation:** Real reservation/hold protocol with locking, idempotent confirm, and reconciliation against the external calendar; define before Phase 5. Document in `Calendar_Integrations.md`.

## R-10 — Voice quality evaluation harness

- **Description:** Non-deterministic voice behavior needs simulated-caller evals, regression gating on prompt/model changes, and production quality monitoring — currently one line in Testing.
- **Severity:** High · **Probability:** High
- **Impact:** Silent quality regressions, undetected hallucinations/failures in production, eroded trust.
- **Owner:** Engineering (AI)
- **Decision:** **Mitigate.**
- **Mitigation:** Build an eval harness (scripted scenarios + assertions on tool calls/outcomes), gate releases on it, and monitor live-call quality (not just latency). Expand [Testing Strategy](Testing_Strategy.md).

## R-11 — Latency budget unengineered

- **Description:** "Sub-second" is asserted with no per-segment budget (Twilio media region → gateway → model region → back); cross-region hops can blow it.
- **Severity:** Medium · **Probability:** High
- **Impact:** Unnatural conversation, higher abandonment, worse quality scores.
- **Owner:** Engineering (Voice)
- **Decision:** **Mitigate.**
- **Mitigation:** Per-hop latency budget, co-location of gateway with media + model regions, measured p95/p99 per segment as an SLO. Document in `Voice_Architecture.md`.

## R-12 — Observability / SLOs / on-call maturity

- **Description:** "Every turn traced" is named, not architected; no tracing backend, alerting, SLOs, or incident response defined.
- **Severity:** Medium · **Probability:** Medium
- **Impact:** Slow detection/resolution of outages for a service where downtime harms customers directly.
- **Owner:** Engineering (Platform)
- **Decision:** **Mitigate.**
- **Mitigation:** Choose a tracing/observability backend; define SLOs and alerts; stand up on-call and an incident-response runbook by Phase 4. Note audio-storage cost of full-turn tracing.

## R-13 — Vendor concentration

- **Description:** Heavy reliance on Twilio, OpenAI, Clerk, Vercel, Stripe — each a dependency and potential single point of failure or pricing risk.
- **Severity:** High · **Probability:** Medium
- **Impact:** Outage or pricing/policy change at one vendor can degrade or halt the product.
- **Owner:** Engineering / Founders
- **Decision:** **Accept + abstract** (revisit at scale).
- **Mitigation:** Keep provider seams (ADR-0002, ADR-0007) so vendors are swappable; monitor for concentration that becomes existential (esp. telephony — see R-02); avoid deep coupling to any single vendor's proprietary features without an abstraction.

---

## Review cadence

- Reviewed at every **phase gate** and whenever an ADR is added.
- New risks get the next `R-NN`. Resolved risks are marked **Fixed** with the ADR/doc reference (kept for history, not deleted).
