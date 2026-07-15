"use client";

import { useEffect } from "react";
import type { BusinessDNA } from "@operatoros/dna";
import { useAvaCall } from "./useAvaCall";

/**
 * The live "Talk to Ava" experience — a real conversation with the receptionist
 * built entirely from the just-generated Business DNA (ADR-0017). Deliberately
 * plain: function over visual flourish, per the Sprint 3 priority freeze.
 */
export function AvaCall({ dna, onClose }: { dna: BusinessDNA; onClose: () => void }) {
  const emp = dna.employees[0];
  const { status, transcript, appointment, errorMessage, start, stop } = useAvaCall();

  useEffect(() => {
    start(dna);
    // Only ever start once per mount — this component is remounted per call attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    stop();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stage/95 p-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-background/12 bg-stage p-6 text-background shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-background/70">
            <span
              className={`h-2 w-2 rounded-full ${
                status === "active"
                  ? "bg-[#7BE3B0] shadow-[0_0_10px_#7BE3B0]"
                  : status === "connecting"
                    ? "animate-pulse bg-brass"
                    : "bg-background/30"
              }`}
            />
            {emp?.name ?? "Ava"} · {dna.business.identity.displayName}
          </div>
          <button onClick={close} className="text-sm text-background/50 hover:text-background">
            Close
          </button>
        </div>

        <div className="mt-6 min-h-[220px]">
          {status === "connecting" && (
            <p className="text-center text-background/60">Connecting you to {emp?.name ?? "Ava"}…</p>
          )}

          {status === "unavailable" && (
            <div className="text-center">
              <p className="text-background/80">The live voice engine isn't connected yet.</p>
              <p className="mt-2 text-sm text-background/50">
                Add a Retell API key to activate real conversations with {emp?.name ?? "Ava"}.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <p className="text-background/80">{errorMessage ?? "Something interrupted the call."}</p>
              <button
                onClick={() => start(dna)}
                className="mt-4 rounded-full border border-background/20 px-5 py-2 text-sm hover:bg-background/10"
              >
                Try again
              </button>
            </div>
          )}

          {(status === "active" || status === "ended") && (
            <div className="space-y-3">
              {transcript.length === 0 && status === "active" && (
                <p className="text-center text-sm text-background/50">Listening…</p>
              )}
              {transcript.map((t, i) => (
                <div key={i} className={t.role === "agent" ? "text-background/90" : "text-background/60"}>
                  <span className="mr-2 text-xs uppercase tracking-wide text-brass">
                    {t.role === "agent" ? emp?.name ?? "Ava" : "You"}
                  </span>
                  {t.content}
                </div>
              ))}

              {appointment && (
                <div className="mt-4 rounded-xl border border-background/12 bg-background/[0.05] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-brass">Appointment scheduled</p>
                  <p className="mt-1 text-background/90">
                    {String(appointment.appointmentType)} for {String(appointment.customerName)} —{" "}
                    {String(appointment.slotLabel)}
                  </p>
                </div>
              )}

              {status === "ended" && (
                <p className="pt-2 text-center text-sm text-background/50">Call ended.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
