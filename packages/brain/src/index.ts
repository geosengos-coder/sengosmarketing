"use client";

/**
 * @operatoros/brain — the Business Brain rendering engine (React Three Fiber).
 * One engine, many surfaces (ADR-0012). Lazy-load `BusinessBrain` from the app.
 *
 * The entry is a client boundary so React Three Fiber resolves the client React
 * build (its reconciler reads React internals at import time).
 */
export { BusinessBrain, type BusinessBrainProps, type BrainVariant } from "./react/BusinessBrain";
export { StaticBrain } from "./fallback/StaticBrain";
export { brainProgress, useBrainProgress, brainFocus, useBrainFocus } from "./store/progress";
export { heroScene } from "./config/heroScene";
export { FAMILY_COLOR, STAGE_BACKGROUND } from "./config/taxonomy";
export type { BrainConfig, BrainNode, BrainEdge, NodeFamily, NodeState } from "./store/types";
