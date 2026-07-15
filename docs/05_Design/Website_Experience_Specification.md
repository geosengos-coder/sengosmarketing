---
title: Website Experience Specification — The Business Brain
section: 05_Design
status: draft
owner: Creative Director / Engineering
created: 2026-07-12
last_updated: 2026-07-12
---

# Website Experience Specification — "The Business Brain"

> **Status:** 🟡 Spec (pre-implementation). This is not a website spec; it is the spec for **the first experience** of OperatorOS — one that demonstrates the product instead of explaining it. Decisions resolved: **live demo = simulated + real seam** ([ADR-0011](../03_Engineering/Decision_Log.md#adr-0011--homepage-live-receptionist-simulated-behind-the-real-voiceprovider-seam)); **Business Brain = React Three Fiber engine** ([ADR-0012](../03_Engineering/Decision_Log.md#adr-0012--polyglot-rendering-the-right-renderer-per-responsibility), engine detail in [Business Brain Rendering Architecture](Business_Brain_Rendering_Architecture.md)). Brand identity: the [Meridian-led synthesis](Brand_Exploration.md#recommendation) — premium/calm, one living-light signature (the Business Brain), human warmth. Explicitly **not** cyberpunk, robots, glowing brains, or stock AI.

## 0. Premise & goal

- **Demonstrate, don't explain.** The visitor understands "the AI learned my business" through interaction, not paragraphs.
- **The Business Brain is the identity.** One living system, reused across hero, interactive demo, live demo, and dashboard preview — the same engine everywhere. The site *is* a live view of the product.
- **Emotional target:** watching intelligence come to life — calm, premium, inevitable. Exit line: *"I've never experienced software presented like that."*
- **Unifying principle:** the marketing Business Brain and the product dashboard use the **same rendering engine and data model**. Brand = product.

## 1. The Business Brain — the core visual language

A living network graph of a business's connected systems, knowledge, activity, and AI employees. It is a stylized-but-faithful view of the real platform graph (maps to our data model: `Integration`, `KnowledgeSource`/`KnowledgeDocument`, `AIEmployee`, conversations/`EventLog`).

**Node taxonomy** (4 semantic families, each with a consistent visual treatment):

| Family | Nodes | Meaning | Visual |
|--------|-------|---------|--------|
| Systems | Website, Calendar, CRM, Phone | Connected integrations | Ringed nodes, connect with an edge-draw |
| Knowledge | Services, Pricing, Policies, Documents | What the AI knows | Softer nodes that emit knowledge particles toward the core |
| Activity | Calls, Customers, Appointments, Analytics | Living interactions | Small nodes that spawn/settle as "memories" |
| Intelligence | AI Employee (core), Business Brain core | The mind | The luminous center; the single "living line" signature |

**Node states:** `dormant` → `connecting` → `connected` → `active` (pulsing). The brain visibly *grows smarter* as families fill in — measured by an on-screen **Intelligence meter**.

**Visual grammar:** breathing nodes; edges that carry flowing knowledge particles; a soft-lit core; depth via layering/parallax/blur; one accent of light. Calm, rationed, premium.

## 2. Narrative / user journey (scroll story)

Scroll progress drives the brain's state. Each scene = one emotional beat + one system message + one brain transformation. Copy is minimal (a few words); the motion carries meaning.

| Scene | On-screen | Brain state | Emotional beat |
|-------|-----------|-------------|----------------|
| 0 · Hero | A small, quiet network; one line of copy | 3–4 dormant nodes, breathing | Curiosity: "what is this?" |
| 1 | "Website connected" | Website node lights; first edges form | Recognition |
| 2 | "Calendar connected" | Calendar node + edges | Momentum |
| 3 | "CRM connected" | CRM node; network denser | Momentum |
| 4 | "Phone connected" | Phone node; the line goes live | Anticipation |
| 5 | "Documents uploaded" | Knowledge particles flow to the core | "It's learning" |
| 6 | "AI Employee activated" | A pulse travels the entire network | **Realization: "it learned my business"** |
| 7 · Interactive | "Explore the mind" | Visitor hovers/clicks nodes | Agency |
| 8 · Live demo | "Talk to it" | Conversation updates the brain live | Belief |
| 9 · Dashboard | "Your mission control" | Brain persists; employees + conversations animate in | Aspiration |
| 10 · Close | "Give your business a brain" | Brain at full glow; single CTA | Conviction |

The narrative must be **fully legible in ~5 seconds per scene** and **fully understandable as text** with motion disabled (see §7).

## 3. Interaction model

- **Scroll orchestration:** a scroll progress value (0–1) maps to a timeline of brain events. Scrubbable both directions; snap-friendly sections. Non-scroll fallback (auto-advance/reduced-motion) available.
- **Interactive nodes (Scene 7):** hover reveals a label + one-line "what this teaches the AI" (e.g. *Pricing → quotes accurately*). Click opens a `NodeInspector` panel with a slightly deeper detail. Connecting more nodes raises the **Intelligence meter** in real time — the visitor *feels* it get smarter.
- **Live receptionist (Scene 8):** click-to-talk (or push-to-talk). The conversation emits brain events: booking an appointment → a pulse + a new Customer node + Calendar update + Analytics increment. The visitor watches the system think.
- **Single source of truth:** scroll, interactive, and live demo all dispatch to **one Business Brain store** (event queue → state → render). No divergent states.

## 4. Animation system

**Recommended renderer:** a custom **Canvas 2D engine** (see §6 for the decision). Deterministic simulation driven by an event queue; `requestAnimationFrame` with delta time.

**Render layers (back→front):**
1. Depth field — subtle drifting particles, soft vignette (parallax on scroll/pointer).
2. Edges — connection lines + traveling knowledge particles.
3. Nodes — breathing bodies + labels.
4. Light — core glow, pulse wavefronts, the "living line" signature.
5. Interaction overlay — DOM/SVG hit targets for accessible hover/click/focus (kept in sync with canvas node positions).

**Motion primitives (tokens):**
- Breathing: scale/opacity sine, ~4s cycle, staggered phase per node.
- Edge formation: line draw-in, 400–600ms, gentle ease.
- Knowledge flow: particles travel edge → core, continuous, low density.
- Pulse propagation: wavefront across the graph by shortest-path distance, ~1.2s.
- Memory creation: node spawn (fade+scale from origin) → settle into layout.
- Easing: calm, physical, **no bounce**; durations 300–600ms; pulse ~1.2s.

**Budget & discipline:** 60fps target on mid hardware; capped particle counts; DPR-capped; `IntersectionObserver` pauses off-screen; layout precomputed (force layout solved once, then animated), not solved every frame.

## 5. Component architecture

The **Business Brain engine is its own package** (`@operatoros/brain`, R3F/WebGL) — full detail in [Business Brain Rendering Architecture](Business_Brain_Rendering_Architecture.md). The experience-specific glue (story, interactive, demo, dashboard preview) lives in `frontend/`, styled with `@operatoros/ui` tokens. Clean separation: **engine (three.js, framework-light) ↔ R3F bindings ↔ headless store ↔ content/config**.

```
packages/brain/          # the reusable R3F engine (see rendering-architecture doc)
  store/ engine/ react/ config/ fallback/   # BrainScene, NodeSystem, ConnectionSystem,
                                            # PulseSystem, CameraController, ParticleLayer,
                                            # LightingSystem, KnowledgeCluster, InteractionController

frontend/src/experience/  # experience glue that drives @operatoros/brain
├── story/
│   ├── ScrollStory.tsx           # scroll → brain timeline orchestrator
│   ├── StoryScene.tsx            # one scene (caption + beat)
│   ├── SceneCaption.tsx          # the "X connected" system messages
│   └── useScrollProgress.ts
├── interactive/
│   ├── NodeInspector.tsx
│   ├── IntelligenceMeter.tsx
│   └── NodeLegend.tsx
├── demo/
│   ├── ReceptionistDemo.tsx
│   ├── voice/VoiceProvider.ts        # interface (ADR-0002/0007 seam)
│   ├── voice/SimulatedVoiceProvider.ts
│   ├── Transcript.tsx / CallControls.tsx
│   └── demoScript.ts                 # deterministic scripted conversation
├── dashboard/
│   └── MissionControlPreview.tsx     # reuses the brain engine
└── shared/
    ├── Section.tsx / Reveal.tsx      # Framer Motion section reveals
    └── reduced-motion.ts
```

- **Engine is pure** (no React/Next imports) → testable and reusable in the real dashboard.
- **Content is data** (`brainConfig`, `demoScript`) → the narrative is editable without touching engine code.
- **One store** powers every context.

## 6. Tech decisions (resolved)

- **Business Brain — React Three Fiber / WebGL**, as the reusable `@operatoros/brain` engine ([ADR-0012](../03_Engineering/Decision_Log.md#adr-0012--polyglot-rendering-the-right-renderer-per-responsibility)). Lazy-loaded and code-split; WebGL/reduced-motion fallbacks mandatory. Engine detail: [Business Brain Rendering Architecture](Business_Brain_Rendering_Architecture.md).
- **Live receptionist — Simulated provider with a real seam** ([ADR-0011](../03_Engineering/Decision_Log.md#adr-0011--homepage-live-receptionist-simulated-behind-the-real-voiceprovider-seam)). `SimulatedVoiceProvider` behind the `VoiceProvider` interface; the real OpenAI Realtime API (`RealtimeVoiceProvider`) drops in later with no UI change.
- **Product UI** = React + Tailwind + shadcn/ui; **micro-animations** = Framer Motion (never the brain); **SVG** = icons/logos/simple diagrams only.

## 7. Performance, accessibility, responsiveness

- **Performance:** code-split the experience; lazy-load below-the-fold scenes; canvas is client-only (SSR-safe); cap DPR and particle counts; pause off-screen; solve layout once. Targets: LCP < 2.5s, 60fps on mid hardware, no CLS from the canvas.
- **Accessibility (first-class, not an afterthought):**
  - `prefers-reduced-motion` → the brain renders as a **static, elegant diagram**; the story becomes readable text; no parallax/particles. The narrative must fully land without motion.
  - Interactive nodes are real focusable DOM elements (overlay) with ARIA labels, keyboard nav, and visible focus.
  - The live demo always shows a **text transcript**; narration/system messages are real text, not baked into canvas.
  - Contrast per tokens; motion never the sole carrier of meaning.
- **Responsiveness:** mobile gets a **simplified brain** (fewer nodes, tap not hover, vertical story), performance-scaled; every scene works on a phone. The realization moment must land on mobile too.

## 8. Section-by-section build plan

1. **Foundation** — refine brand tokens (Meridian palette), `Section`/`Reveal` primitives, reduced-motion infra.
2. **Brain engine** — Canvas engine + data model + hero scene (breathing network). Verify 60fps + reduced-motion fallback.
3. **Scroll narrative** — Scenes 1–6 with system captions and brain growth to the realization pulse.
4. **Interactive nodes** — hover/click, `NodeInspector`, `IntelligenceMeter`.
5. **Live receptionist (simulated)** — wired to brain events.
6. **Dashboard preview** — mission control reusing the engine.
7. **Close/CTA + polish**.
8. **Critique & iterate** — self-review as Apple CD / Linear Head of Design; fix every weakness; repeat until cohesive.

## 9. Success criteria

- The realization ("it learned my business") lands **without paragraphs**.
- 60fps on mid hardware; **full parity** with reduced-motion and on mobile.
- The marketing brain and the product brain are visibly the same system.
- Testers say: *"I've never experienced software presented like that."*

## Related

- [Brand Exploration](Brand_Exploration.md) · [Design System](Design_System.md) · [Motion Principles](Motion_Principles.md) · [Dashboard](Dashboard.md)
- [Architecture](../03_Engineering/Architecture.md) · [Voice Architecture](../04_AI/Voice_Architecture.md) · [Decision Log](../03_Engineering/Decision_Log.md)
