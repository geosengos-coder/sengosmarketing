"use client";

import { useCallback, useRef, useState } from "react";
import type { DNAEvent } from "@operatoros/dna";

export type DnaStatus = "idle" | "running" | "done" | "error";

export interface DnaInput {
  businessName: string;
  websiteUrl?: string;
  industry?: string;
  city?: string;
}

/**
 * Consumes the NDJSON stream of Business DNA events from the server. Provider-
 * agnostic: it only knows about `DNAEvent`s. Real progress, never simulated.
 */
export function useDnaStream() {
  const [events, setEvents] = useState<DNAEvent[]>([]);
  const [status, setStatus] = useState<DnaStatus>("idle");
  const running = useRef(false);

  const start = useCallback(async (input: DnaInput) => {
    if (running.current) return;
    running.current = true;
    setEvents([]);
    setStatus("running");
    try {
      const res = await fetch("/api/dna/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          try {
            const event = JSON.parse(line) as DNAEvent;
            setEvents((prev) => [...prev, event]);
            if (event.stage === "complete") setStatus("done");
            if (event.stage === "error") setStatus("error");
          } catch {
            // ignore malformed line
          }
        }
      }
      setStatus((s) => (s === "running" ? "done" : s));
    } catch {
      setStatus("error");
    } finally {
      running.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setEvents([]);
    setStatus("idle");
  }, []);

  return { events, status, start, reset };
}
