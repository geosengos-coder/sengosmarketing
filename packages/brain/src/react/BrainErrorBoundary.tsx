"use client";

import { Component, type ReactNode } from "react";

/**
 * If the WebGL scene fails to initialize (driver issues, bundler/runtime quirks),
 * we degrade to the accessible static brain rather than showing an error. Graceful
 * degradation is a requirement of the rendering architecture, not an afterthought.
 */
export class BrainErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    if (typeof console !== "undefined") {
      console.warn("[BusinessBrain] WebGL scene failed; using static fallback.", error);
    }
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
