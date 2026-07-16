"use client";

import { useCallback, useRef, useState } from "react";
import type { BusinessDNA } from "@operatoros/dna";
import type { RetellWebClient } from "retell-client-js-sdk";

export type AvaCallStatus = "idle" | "connecting" | "unavailable" | "active" | "ended" | "error";

export interface TranscriptTurn {
  role: "agent" | "user";
  content: string;
}

/**
 * Drives the live "Talk to Ava" call: creates a server-side session (which itself
 * builds the Retell agent entirely from the Business DNA), connects the browser
 * mic via Retell's Web Client SDK, and listens for tool-driven UI events (e.g. the
 * booked appointment) over SSE. No scripted/simulated path — see ADR-0017.
 */
export function useAvaCall() {
  const [status, setStatus] = useState<AvaCallStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [appointment, setAppointment] = useState<Record<string, unknown> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clientRef = useRef<RetellWebClient | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const cleanup = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    clientRef.current = null;
  }, []);

  const start = useCallback(
    async (dna: BusinessDNA) => {
      setStatus("connecting");
      setTranscript([]);
      setAppointment(null);
      setErrorMessage(null);

      try {
        const res = await fetch("/api/voice/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ dna }),
        });

        if (res.status === 503) {
          setStatus("unavailable");
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({ message: "Couldn't start the call." }));
          setErrorMessage(body.message);
          setStatus("error");
          return;
        }

        const session = (await res.json()) as {
          sessionId: string;
          connection: { accessToken: string };
        };
        const es = new EventSource(`/api/voice/events/${session.sessionId}`);
        es.onmessage = (evt) => {
          try {
            const parsed = JSON.parse(evt.data);
            if (parsed.type === "appointment_booked") setAppointment(parsed.data);
          } catch {
            // ignore malformed events
          }
        };
        esRef.current = es;

        const { RetellWebClient } = await import("retell-client-js-sdk");
        const client = new RetellWebClient();
        clientRef.current = client;

        client.on("call_started", () => setStatus("active"));
        client.on("call_ended", () => setStatus("ended"));
        client.on("error", () => {
          setStatus("error");
          setErrorMessage("The call disconnected unexpectedly.");
        });
        client.on("update", (update: { transcript?: { role: string; content: string }[] }) => {
          if (update.transcript) {
            setTranscript(
              update.transcript.map((t) => ({
                role: t.role === "agent" ? "agent" : "user",
                content: t.content,
              })),
            );
          }
        });

        await client.startCall({ accessToken: session.connection.accessToken });
      } catch (err) {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Microphone or connection unavailable.");
      }
    },
    [],
  );

  const stop = useCallback(() => {
    try {
      clientRef.current?.stopCall?.();
    } finally {
      cleanup();
      setStatus((s) => (s === "active" ? "ended" : s));
    }
  }, [cleanup]);

  return { status, transcript, appointment, errorMessage, start, stop };
}
