---
title: Voice Employee Experience — "Talk to Ava"
section: 04_AI
status: stable
owner: Engineering / AI
created: 2026-07-14
last_updated: 2026-07-14
---

# Voice Employee Experience — "Talk to Ava"

> **Status:** 🟢 Authored + built (`@operatoros/voice`). Sprint 3: the first complete AI Employee experience — a real conversation with a receptionist built entirely from the Business DNA the visitor just watched form ([ADR-0017](../03_Engineering/Decision_Log.md#adr-0017--retell-as-the-concrete-voiceprovider-for-the-talk-to-ava-experience)). Not a website feature — the demonstration of the product itself.

## The point

Movement 3 (the DNA experience) proves the AI *understands* a business. This closes the loop: the visitor clicks **"Talk to {name}"** and actually talks to the employee that understanding produced — it answers questions specific to their business, and it **books a sample appointment**, live, with the UI updating the instant it happens.

## Architecture

```
Business DNA (client, just generated)
        │  POST /api/voice/session { dna }
        ▼
getVoiceProvider() ──null──▶ 503 "voice engine not connected" (honest, never a fake call)
        │  Retell configured
        ▼
buildAgentBlueprint(dna, role)         ← toRuntime() from @operatoros/dna — the ONLY prompt source
        │
        ▼
RetellVoiceProvider.createSession()  →  create-retell-llm → create-agent → create-web-call
        │
        ▼
{ sessionId, connection: { accessToken } }  ──▶  browser: RetellWebClient.startCall()
                                                        │  mid-call tool calls
                                                        ▼
                                    POST /api/voice/tools?session&secret  →  executeTool()
                                                        │
                                                        ├─▶ spoken result back to Retell
                                                        └─▶ SSE /api/voice/events/[sessionId] → UI updates live
```

## DNA is the only knowledge source (enforced, not just intended)

`buildAgentBlueprint()` in `packages/voice/src/mapping.ts` calls `toRuntime(dna, role)` and uses its `systemPrompt` **verbatim** as the Retell agent's prompt, and its `toolAllowlist` (intersected with what we can execute) as the callable tool set. There is no per-business copy anywhere in `packages/voice` or the API routes — the only hand-authored text in the entire path is the generic industry/role *templates* inside `@operatoros/dna`, which is exactly the platform's existing design (ADR-0015). A unit test (`voice.test.ts`) asserts the generated prompt contains the business's real name and that tool argument enums are populated from its real appointment types — proving derivation, not authorship.

## VoiceProvider stays abstracted (ADR-0002, ADR-0007, amended by ADR-0017)

`packages/voice/src/types.ts` defines `VoiceProvider` (`createSession`, `endSession`). `RetellVoiceProvider` is the only class that knows Retell's wire format — REST calls to `create-retell-llm`, `create-agent`, `v2/create-web-call`, and the custom-function-call webhook contract. Swapping to a direct OpenAI Realtime + ElevenLabs pipeline (ADR-0013's original plan) means writing a new class implementing the same interface; nothing else changes.

**Honesty note:** `RetellVoiceProvider` was implemented from established, long-standing Retell API patterns, not a fresh docs fetch (a live web-search attempt hit a session limit mid-build). Field names are isolated to this one file specifically so a mismatch against Retell's current API is a small, contained fix — **verify against Retell's current API reference before pointing this at a real account.**

## Tool execution — scoped to prove the pattern

`packages/voice/src/tools.ts` defines `SUPPORTED_TOOL_KEYS`: `check_availability`, `book_appointment`, `lookup_contact`, `take_message`. Only tools that are **both** in the DNA's `toolAllowlist` **and** in this list are ever registered — the full platform tool vocabulary (`create_contact`, `send_sms`, etc.) exists in `@operatoros/dna` for the product but isn't wired to execution here yet.

`packages/voice/src/executor.ts` runs the actual logic: `book_appointment` matches the requested service against the DNA's real `scheduling.appointmentTypes`, synthesizes a plausible slot, records it in the session, and publishes a `appointment_booked` UI event. This is explicitly a **sample appointment** against no real calendar — there is no tenant to book into for an anonymous marketing-site visitor, and the UI/copy never claims otherwise.

## Ephemeral by design — not the tenant data path

`packages/voice/src/session-store.ts` is an **in-memory, single-process, 10-minute-TTL** store keyed by a generated `sessionId`. It never touches `@operatoros/database` or Postgres RLS — this is a deliberate, documented departure from the multi-tenant path (ADR-0003), because the homepage demo has no real organization to scope to. A production multi-instance deployment would move this to Redis; noted as a follow-up, not a blocker.

## Live UI updates

`packages/voice/src/events.ts` is an in-memory pub-sub. The tool webhook publishes; `GET /api/voice/events/[sessionId]` (SSE) forwards to the browser; `useAvaCall` listens and sets `appointment` state the instant Ava confirms a booking — the visitor watches the UI update **during** the call, not after.

## Guardrails (ADR-0013/0017 requirements)

- **No key → honest unavailability**, never a scripted/fake conversation (the founder was explicit: this centerpiece must be real).
- **Per-IP rate limiting** on session creation (`frontend/app/api/voice/session/route.ts`).
- **Session TTL** (10 min) bounds memory and abuse.
- **Capped call duration** (`maxCallDurationMs`, 5 min) passed to the Retell agent.
- **Webhook secret per session** — the tool-execution endpoint verifies a random secret embedded in the URL before running anything.

## Operational prerequisites

1. **`RETELL_API_KEY`** (+ optionally `RETELL_DEFAULT_VOICE_ID`, `RETELL_LLM_MODEL`) in the server environment.
2. **`PUBLIC_APP_URL`** — Retell's servers must reach our tool webhook over the public internet. A local dev server needs a tunnel (e.g. ngrok); without one, a session can still be created but Ava cannot complete tool calls (bookings, lookups).
3. `OPENAI_API_KEY` (ADR-0016) so the Business DNA itself is real analysis rather than the heuristic fallback — the richer the DNA, the more specific Ava's answers are.

Until (1)+(2) exist, the "Talk to Ava" button surfaces the honest "voice engine not connected" state described above.

## Package

`@operatoros/voice` — `types.ts` (the abstraction), `mapping.ts` (DNA → agent blueprint), `tools.ts` (demo tool schemas), `executor.ts` (tool logic), `session-store.ts`, `events.ts`, `provider.ts` (env-based factory), `retell-provider.ts` (the one Retell-aware file). Framework-free except for Node's `fetch`/`crypto`. Verified: typecheck clean; unit tests green (4/4) — prompt/tool derivation, booking + UI event, unknown-session handling, webhook secret verification.

## Frontend

`frontend/app/api/voice/{session,tools,events/[sessionId]}/route.ts` + `frontend/src/experience/voice/{useAvaCall.ts,AvaCall.tsx}`, wired from the "Talk to {name}" button in the Movement 3 reveal (`DnaExperience.tsx`).

## Open questions / next steps

- Verify Retell field names against current docs; add a thin integration smoke test once a real key is available.
- Multi-instance session/event store (Redis) before this runs on more than one server process.
- Decide whether the product's onboarding (Phase 3/4) reuses this exact `VoiceProvider` + session pattern for real tenants, or introduces a parallel tenant-scoped path (it should almost certainly be the former, with `withTenant` replacing the in-memory store).

## Related

- [ADR-0017](../03_Engineering/Decision_Log.md#adr-0017--retell-as-the-concrete-voiceprovider-for-the-talk-to-ava-experience) · [Business DNA](Business_DNA.md) · [Voice Architecture](Voice_Architecture.md) · [Flagship Creative Direction](../05_Design/Flagship_Experience_Creative_Direction.md)
