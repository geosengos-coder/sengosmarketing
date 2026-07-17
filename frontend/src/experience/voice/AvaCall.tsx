"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { BusinessDNA } from "@operatoros/dna";
import { useAvaCall } from "./useAvaCall";
import { toOrbState, type OrbState } from "./orbState";
import { VoiceOrb } from "./VoiceOrb";

/**
 * The live "Talk to Ava" experience — a real conversation with the receptionist
 * built entirely from the just-generated Business DNA (ADR-0017). The orb is the
 * centerpiece: a futuristic voice interface whose animation is driven by the real
 * call state (connecting / listening / thinking / speaking) and live agent audio.
 * The Retell connection, mic capture, and permissions are unchanged — this is a
 * visual layer over the same hook.
 */
export function AvaCall({ dna, onClose }: { dna: BusinessDNA; onClose: () => void }) {
  const emp = dna.employees[0];
  const name = emp?.name ?? "Ava";
  const {
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
  } = useAvaCall();

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    start(dna);
    // Only ever start once per mount — this component is remounted per call attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the newest turn in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  const close = () => {
    stop();
    onClose();
  };

  const lastRole = transcript.at(-1)?.role;
  const orb: OrbState =
    status === "unavailable" ? "idle" : toOrbState(status, agentTalking, lastRole);

  const caption: Record<OrbState, string> = {
    idle: "",
    connecting: `Connecting to ${name}…`,
    listening: "Listening…",
    thinking: `${name} is thinking…`,
    speaking: `${name} is speaking`,
    ended: "Call ended",
    error: errorMessage ?? "Something interrupted the call.",
  };
  const captionText =
    status === "unavailable" ? "Live voice isn't connected yet" : caption[orb];

  const showConversation = status === "active" || status === "ended";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden text-background"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 8%, hsl(48 20% 10%) 0%, hsl(45 22% 4%) 55%, #050505 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <div className="flex items-center gap-2.5 text-sm text-background/70">
          <span
            className={`h-2 w-2 rounded-full transition-colors ${
              status === "active"
                ? "bg-[#7BE3B0] shadow-[0_0_10px_#7BE3B0]"
                : status === "connecting"
                  ? "animate-pulse bg-brass"
                  : status === "error"
                    ? "bg-[#E0607A]"
                    : "bg-background/30"
            }`}
          />
          <span className="font-medium text-background/90">{name}</span>
          <span className="text-background/40">·</span>
          <span className="truncate max-w-[40vw]">{dna.business.identity.displayName}</span>
        </div>
        <button
          onClick={close}
          className="rounded-full border border-background/15 px-4 py-1.5 text-xs text-background/60 transition-colors hover:bg-background/10 hover:text-background"
        >
          Close
        </button>
      </div>

      {/* Orb + caption */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <VoiceOrb state={orb} amplitudeRef={amplitudeRef} />

        <div className="mt-8 h-6 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={captionText}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="text-sm uppercase tracking-[0.28em] text-background/55"
            >
              {captionText}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Unavailable / error helper copy */}
        {status === "unavailable" && (
          <p className="mt-3 max-w-sm text-center text-sm text-background/45">
            Add a Retell API key to activate real conversations with {name}.
          </p>
        )}
      </div>

      {/* Conversation + appointment */}
      {showConversation && (transcript.length > 0 || appointment) && (
        <div className="mx-auto w-full max-w-xl px-6">
          <div
            ref={scrollRef}
            className="max-h-[26vh] space-y-2 overflow-y-auto rounded-2xl border border-background/10 bg-background/[0.04] p-4 backdrop-blur-md"
            style={{
              maskImage: "linear-gradient(to bottom, transparent, #000 12%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 12%)",
            }}
          >
            {transcript.map((t, i) => (
              <div
                key={i}
                className={`text-sm leading-relaxed ${
                  t.role === "agent" ? "text-background/90" : "text-background/55"
                }`}
              >
                <span className="mr-2 text-[10px] uppercase tracking-[0.2em] text-brass">
                  {t.role === "agent" ? name : "You"}
                </span>
                {t.content}
              </div>
            ))}

            {appointment && (
              <div className="mt-3 rounded-xl border border-[#7BE3B0]/25 bg-[#7BE3B0]/[0.06] p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#7BE3B0]">
                  Appointment scheduled
                </p>
                <p className="mt-1 text-sm text-background/90">
                  {String(appointment.appointmentType)} for {String(appointment.customerName)} —{" "}
                  {String(appointment.slotLabel)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className="flex items-center justify-center gap-3 px-6 py-6 sm:py-8"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        {status === "active" && (
          <>
            <button
              onClick={toggleMute}
              aria-pressed={muted}
              className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
                muted
                  ? "border-background/20 bg-background/10 text-background/80"
                  : "border-background/15 text-background/60 hover:bg-background/10"
              }`}
              title={muted ? "Unmute microphone" : "Mute microphone"}
            >
              {muted ? <MicOffIcon /> : <MicIcon />}
            </button>
            <button
              onClick={close}
              className="flex h-12 items-center gap-2 rounded-full bg-[#E0607A] px-6 text-sm font-medium text-white shadow-[0_8px_30px_rgba(224,96,122,0.35)] transition-transform hover:scale-[1.03]"
            >
              <EndCallIcon />
              End call
            </button>
          </>
        )}

        {status === "connecting" && (
          <button
            onClick={close}
            className="rounded-full border border-background/15 px-6 py-3 text-sm text-background/60 transition-colors hover:bg-background/10"
          >
            Cancel
          </button>
        )}

        {(status === "error" || status === "ended" || status === "unavailable") && (
          <div className="flex items-center gap-3">
            {status !== "unavailable" && (
              <button
                onClick={() => start(dna)}
                className="rounded-full bg-background px-6 py-3 text-sm font-medium text-stage transition-transform hover:scale-[1.03]"
              >
                {status === "ended" ? "Call again" : "Try again"}
              </button>
            )}
            <button
              onClick={close}
              className="rounded-full border border-background/15 px-6 py-3 text-sm text-background/60 transition-colors hover:bg-background/10"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 9v-.5a3 3 0 0 1 6 0V11M15 12.5a3 3 0 0 1-4.5 2.6M5 11a7 7 0 0 0 10.5 6.06M19 11a7 7 0 0 1-.5 2.6M12 18v3" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

function EndCallIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 9.5c6-4 13-4 19 0l-2 3-3.5-1-.5-2.5c-2.3-.7-4.7-.7-7 0l-.5 2.5-3.5 1z" transform="rotate(135 12 11)" />
    </svg>
  );
}
