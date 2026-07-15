"use client";

import { Suspense, lazy, useEffect, useState } from "react";
import { BrainErrorBoundary } from "./BrainErrorBoundary";
import { StaticBrain } from "../fallback/StaticBrain";
import { heroScene } from "../config/heroScene";
import type { BrainConfig } from "../store/types";

export type BrainVariant = "hero" | "dashboard" | "onboarding" | "loading";

export interface BusinessBrainProps {
  variant?: BrainVariant;
  config?: BrainConfig;
}

// The WebGL scene (and three.js/fiber) is loaded ONLY when the enhanced path is
// actually used — so the static/fallback path never evaluates three.js, and any
// load/eval failure is caught by the error boundary and degrades gracefully.
const BrainScene = lazy(() =>
  import("./BrainScene").then((m) => ({ default: m.BrainScene })),
);

/**
 * Detects whether the enhanced WebGL experience should render. WebGL must be
 * available AND the user must not prefer reduced motion. Returns null until the
 * check runs on the client (server + first paint show the static fallback).
 */
function useEnhanced(): boolean | null {
  const [enhanced, setEnhanced] = useState<boolean | null>(null);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let webgl = false;
    try {
      const canvas = document.createElement("canvas");
      webgl = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      webgl = false;
    }
    setEnhanced(webgl && !reduce);
  }, []);
  return enhanced;
}

/**
 * The public entry point. One engine, many surfaces (variant + config). WebGL is an
 * enhancement over the accessible StaticBrain, never the base.
 */
export function BusinessBrain({ config = heroScene }: BusinessBrainProps) {
  const enhanced = useEnhanced();
  const fallback = <StaticBrain config={config} />;
  if (!enhanced) return fallback;
  return (
    <BrainErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <BrainScene config={config} />
      </Suspense>
    </BrainErrorBoundary>
  );
}

export default BusinessBrain;
