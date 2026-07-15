"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny external store for the journey's scroll progress (0→1). The scroll handler
 * writes it (throttled to rAF); the WebGL systems read it every frame without
 * causing React re-renders, and DOM overlays subscribe via {@link useBrainProgress}.
 */
let value = 0;
const subscribers = new Set<() => void>();

export const brainProgress = {
  get: () => value,
  set: (v: number) => {
    const clamped = v < 0 ? 0 : v > 1 ? 1 : v;
    if (clamped !== value) {
      value = clamped;
      for (const fn of subscribers) fn();
    }
  },
  subscribe: (fn: () => void) => {
    subscribers.add(fn);
    return () => {
      subscribers.delete(fn);
    };
  },
};

export function useBrainProgress(): number {
  return useSyncExternalStore(
    brainProgress.subscribe,
    () => value,
    () => 0,
  );
}

/**
 * The node currently being "learned" — set as each Business DNA insight lands so the
 * matching node visibly focuses (Movement 3). null = no focus.
 */
let focus: string | null = null;
const focusSubs = new Set<() => void>();

export const brainFocus = {
  get: () => focus,
  set: (v: string | null) => {
    if (v !== focus) {
      focus = v;
      for (const fn of focusSubs) fn();
    }
  },
  subscribe: (fn: () => void) => {
    focusSubs.add(fn);
    return () => {
      focusSubs.delete(fn);
    };
  },
};

export function useBrainFocus(): string | null {
  return useSyncExternalStore(
    brainFocus.subscribe,
    () => focus,
    () => null,
  );
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** How revealed satellite `index` of `total` is at the given progress (staggered). */
export function satelliteReveal(index: number, total: number, progress: number): number {
  const start = 0.12 + (index / total) * 0.6;
  return smoothstep(start, start + 0.16, progress);
}
