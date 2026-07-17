"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny external store bridging the Industries picker to the DNA intake form —
 * same pattern as @operatoros/brain's progress store. Clicking an industry card
 * sets this and scrolls to the intake form, which reads it as its initial value.
 */
let value = "";
const subscribers = new Set<() => void>();

export const selectedIndustry = {
  get: () => value,
  set: (v: string) => {
    if (v !== value) {
      value = v;
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

export function useSelectedIndustry(): string {
  return useSyncExternalStore(
    selectedIndustry.subscribe,
    () => value,
    () => "",
  );
}
