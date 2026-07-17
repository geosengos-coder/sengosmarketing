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
 *
 * Beyond the raw call it surfaces the fine-grained signals the voice orb needs:
 * `agentTalking` (from Retell's talking events) and a live, per-frame audio
 * `amplitudeRef` (from the SDK's playback analyser) so the "speaking" visual is
 * synced to the real agent audio rather than a simulated waveform. The Retell
 * connection, mic capture, and permissions are untouched.
 */
export function useAvaCall() {
  const [status, setStatus] = useState<AvaCallStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [appointment, setAppointment] = useState<Record<string, unknown> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [agentTalking, setAgentTalking] = useState(false);
  const [muted, setMuted] = useState(false);

  const clientRef = useRef<RetellWebClient | null>(null);
  const esRef = useRef<EventSource | null>(null);
  /** Smoothed live output level (0..1) of the agent's voice; read per-frame by the orb. */
  const amplitudeRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    amplitudeRef.current = 0;
    setAgentTalking(false);
    setMuted(false);
    clientRef.current = null;
  }, []);

  /** Poll the SDK's analyser each frame → a normalized, smoothed amplitude for the orb. */
  const runAmplitudeLoop = useCallback(() => {
    const tick = () => {
      let level = 0;
      try {
        const raw = clientRef.current?.analyzerComponent?.calculateVolume?.();
        if (typeof raw === "number" && Number.isFinite(raw)) {
          // calculateVolume returns a small RMS-ish figure; normalize defensively so
          // the visual is stable regardless of the SDK's exact scale.
          level = raw > 1 ? Math.min(1, raw / 100) : Math.max(0, raw);
        }
      } catch {
        // analyser not ready yet (pre-playback) — decay toward silence.
      }
      // Attack fast, release slow: feels like a real voice meter.
      const prev = amplitudeRef.current;
      amplitudeRef.current = level > prev ? level : prev * 0.85 + level * 0.15;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(
    async (dna: BusinessDNA) => {
      setStatus("connecting");
      setTranscript([]);
      setAppointment(null);
      setErrorMessage(null);
      setAgentTalking(false);
      setMuted(false);

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
        client.on("call_ended", () => {
          setAgentTalking(false);
          amplitudeRef.current = 0;
          setStatus("ended");
        });
        client.on("error", () => {
          setStatus("error");
          setErrorMessage("The call disconnected unexpectedly.");
        });
        // Talking events drive the orb's speaking↔listening transitions.
        client.on("agent_start_talking", () => setAgentTalking(true));
        client.on("agent_stop_talking", () => {
          setAgentTalking(false);
          amplitudeRef.current = 0;
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
        runAmplitudeLoop();
      } catch (err) {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Microphone or connection unavailable.");
      }
    },
    [runAmplitudeLoop],
  );

  const stop = useCallback(() => {
    try {
      clientRef.current?.stopCall?.();
    } finally {
      cleanup();
      setStatus((s) => (s === "active" ? "ended" : s));
    }
  }, [cleanup]);

  /** Toggle the caller's microphone. Wraps the SDK's mute/unmute; connection untouched. */
  const toggleMute = useCallback(() => {
    const client = clientRef.current;
    if (!client) return;
    setMuted((m) => {
      const next = !m;
      if (next) client.mute();
      else client.unmute();
      return next;
    });
  }, []);

  return {
    status,
    transcript,
    appointment,
    errorMessage,
    agentTalking,
    amplitudeRef,
    muted,
    start,
    stop,
    toggleMute,
  };
}
