"use client";

import { useEffect, type RefObject } from "react";
import { brainProgress } from "@operatoros/brain";

/**
 * Maps scroll position over the tall journey track to 0→1 and feeds the Business
 * Brain's progress store (throttled to animation frames). One scroll = one timeline.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Only drive the brain while the journey is on screen — hand control to
      // later movements (the DNA experience) once it has scrolled away.
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? -rect.top / total : 0;
      brainProgress.set(p);
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [ref]);
}
