---
title: Business Brain — Rendering Architecture
section: 05_Design
status: stable
owner: Engineering / Creative Director
created: 2026-07-12
last_updated: 2026-07-12
---

# Business Brain — Rendering Architecture

> **Status:** 🟢 Authored (pre-implementation). The engineering architecture for the Business Brain: a reusable **React Three Fiber (WebGL)** engine that is a **core product component**, not a hero animation ([ADR-0012](../03_Engineering/Decision_Log.md#adr-0012--polyglot-rendering-the-right-renderer-per-responsibility)). Not to be confused with [`04_AI/Business_Brain.md`](../04_AI/Business_Brain.md) — that describes the *AI's* per-tenant knowledge; this document is the engine that *visualizes* it.

## Principle

**One engine, many surfaces.** The same engine renders the homepage hero, the dashboard, onboarding, analytics, and loading states — differing only by configuration, camera, and interaction mode. It should feel like a **living digital organism**, not decoration. Because the marketing brain and the product brain are literally the same code bound to different data, **brand = product**.

## Renderer boundaries (ADR-0012)

| Responsibility | Tech | Why |
|----------------|------|-----|
| Business Brain | **R3F / WebGL** (`@operatoros/brain`) | GPU depth, lighting, particles, thousands of nodes @ 60fps |
| Product UI | React + Tailwind + shadcn/ui | Fast, accessible, maintainable |
| Micro-animations | Framer Motion | UI motion — **never** drives the brain |
| Icons / logos / simple diagrams | SVG | Crisp, tiny, accessible |

## Stack

`three` · `@react-three/fiber` (React renderer for three) · `@react-three/drei` (helpers: `Instances`, `PerformanceMonitor`, `AdaptiveDpr`, `Preload`) · `@react-three/postprocessing` (bloom / depth-of-field for the soft glow). All **lazy-loaded** (see [Performance](#performance-architecture)).

## Package architecture — `@operatoros/brain`

Designed as a reusable platform, not a page component. Engine logic is framework-light (plain three.js) so it is testable and portable; R3F components orchestrate it; a **headless store** owns state so any surface can drive the same brain.

```
packages/brain/
├── src/
│   ├── store/
│   │   └── brainStore.ts        # headless state + event queue (no three, no React)
│   ├── engine/                  # framework-light three.js systems (no React)
│   │   ├── NodeSystem.ts        # InstancedMesh of nodes; states, breathing
│   │   ├── ConnectionSystem.ts  # edges + knowledge particles along them
│   │   ├── PulseSystem.ts       # wavefront propagation across the graph
│   │   ├── ParticleLayer.ts     # ambient depth particles (Points/instanced)
│   │   ├── LightingSystem.ts    # key/fill/rim + core glow config
│   │   ├── KnowledgeCluster.ts  # grouping/flow of knowledge nodes to the core
│   │   ├── layout.ts            # force layout solved once, then animated
│   │   └── types.ts             # BrainNode, BrainEdge, BrainEvent, NodeState
│   ├── react/                   # R3F bindings
│   │   ├── BrainScene.tsx       # <Canvas> root: scene, systems, post, frameloop
│   │   ├── CameraController.tsx # drift, scroll-linked moves, pointer parallax
│   │   ├── InteractionController.tsx # raycasting → events; syncs DOM overlay
│   │   ├── NodeOverlay.tsx      # accessible DOM hit-targets (focus/hover/click)
│   │   └── BusinessBrain.tsx    # PUBLIC component: variant + config, lazy entry
│   ├── config/
│   │   ├── taxonomy.ts          # node families + visual treatments
│   │   ├── heroScene.ts
│   │   ├── dashboardScene.ts
│   │   ├── onboarding.ts
│   │   └── loading.ts
│   ├── fallback/
│   │   └── StaticBrain.tsx      # SVG/image fallback (no-WebGL / reduced-motion)
│   └── index.ts
```

### The systems (as requested)

- **BrainScene** — the R3F `<Canvas>` root; owns scene graph, camera, lighting, postprocessing, and the frame loop. Mounts the other systems.
- **NodeSystem** — nodes as a single `InstancedMesh` (one draw call → scales to thousands); per-node state (`dormant`/`connecting`/`connected`/`active`) and breathing animation via instance matrices/attributes.
- **ConnectionSystem** — edges (lines/tubes) plus animated knowledge particles traveling edge → core; particle buffers updated in `useFrame`.
- **PulseSystem** — the signature "living line": a wavefront propagating across the graph by shortest-path distance (shader time uniform or per-node timing).
- **CameraController** — organic drift, scroll-linked camera moves (homepage story), and subtle pointer parallax; damped, never abrupt.
- **ParticleLayer** — ambient depth field (`Points`/instanced), parallaxed for depth.
- **LightingSystem** — soft key/fill/rim + core glow; bloom via postprocessing for the luminous center.
- **KnowledgeCluster** — layout + flow behavior grouping knowledge nodes as they feed the core (the "it's learning" beat).
- **InteractionController** — GPU raycasting for hover/click, emitting `BrainEvent`s and keeping the accessible `NodeOverlay` in sync.

### State & event model (headless)

`brainStore` is framework-agnostic: `{ nodes, edges, intelligence } ` + a dispatch of `BrainEvent`s (`connect`, `activate`, `pulse`, `addMemory`, `updateAnalytics`). Rendering **subscribes** to the store; it never owns truth. This is why one engine serves every surface:

- **Homepage:** scroll orchestrator + `SimulatedVoiceProvider` (ADR-0011) dispatch events.
- **Dashboard:** real product data (`Integration`, `KnowledgeSource`/`KnowledgeDocument`, `AIEmployee`, `EventLog`) maps to the **same** node/edge/event shape.
- **Onboarding / analytics / loading:** scripted or data-bound configs.

Public API sketch: `<BusinessBrain variant="hero" | "dashboard" | "onboarding" | "loading" config={…} interactive />`.

## Performance architecture

- **Lazy-loaded, code-split.** The whole engine is imported via `next/dynamic(… , { ssr: false })` behind `Suspense`; initial page JS excludes three.js. Preload on idle / on scroll-intent so it's ready before it enters view. Reserve layout space to avoid CLS.
- **GPU instancing.** Nodes and particles are `InstancedMesh`/`Points` — single draw calls, scaling to thousands without CPU-side per-object overhead.
- **Adaptive quality.** drei `<PerformanceMonitor>` + `<AdaptiveDpr>` scale DPR, particle counts, and postprocessing to sustain 60fps; capped DPR (≤2).
- **Frame discipline.** `frameloop="demand"` where the scene is static; otherwise throttle; **pause when off-screen** (IntersectionObserver / `visible`). Layout solved once, then animated (no per-frame force solve).
- **Budget.** 60fps on modern hardware; graceful, automatic degradation below. Initial route unaffected by the engine's weight.

## Graceful degradation & accessibility

WebGL and heavy motion are **enhancements over an accessible base**, never the base:

- **No WebGL / low capability** → `StaticBrain` (a crafted SVG/image diagram) + the narrative as real text. Detected before mounting the canvas.
- **`prefers-reduced-motion`** → static camera, no particles/pulse/parallax; the story still reads fully.
- **Interactive nodes** are always real focusable DOM elements (`NodeOverlay`) with ARIA labels and keyboard nav — hit-testing never lives only in the canvas.
- **Live demo** always renders a text transcript; system captions are real text, not baked into WebGL.
- **Mobile** → reduced node/particle counts, simpler post, tap not hover; the experience (and the realization moment) must land on a phone.

## SSR / Next.js

Canvas is client-only (`ssr: false`); mounts after hydration; space reserved to prevent layout shift; no WebGL work during SSR. Fallback renders server-side so there's always meaningful first paint.

## Reuse roadmap

Same engine, config-driven, powers: **homepage** (scroll story + live demo) → **dashboard** (mission control, real data) → **onboarding** (brain assembling as you connect systems) → **analytics** (activity animating into the graph) → **loading states** (a calm breathing brain). New surfaces are new configs, not new engines — the "design it like a platform" requirement.

## Open questions

- Node layout algorithm (force-directed vs. curated constellations per variant) — likely curated for hero, force-directed for data-bound dashboard.
- Postprocessing budget on mobile (bloom is expensive) — likely off below a perf threshold.
- Extracting `brainStore`'s dashboard binding to consume live `EventLog` streams (Phase 2+).

## Related

- [Website Experience Specification](Website_Experience_Specification.md) · [Design System](Design_System.md) · [Motion Principles](Motion_Principles.md)
- [ADR-0012](../03_Engineering/Decision_Log.md#adr-0012--polyglot-rendering-the-right-renderer-per-responsibility) · [ADR-0011](../03_Engineering/Decision_Log.md#adr-0011--homepage-live-receptionist-simulated-behind-the-real-voiceprovider-seam) · [04_AI/Business_Brain](../04_AI/Business_Brain.md)
