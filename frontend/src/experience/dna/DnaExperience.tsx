"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { brainFocus, brainProgress } from "@operatoros/brain";
import { IndustrySchema, type BusinessDNA } from "@operatoros/dna";
import { useDnaStream } from "./useDnaStream";
import { useSelectedIndustry } from "./selectedIndustry";
import { AvaCall } from "../voice/AvaCall";

const BusinessBrain = dynamic(() => import("@operatoros/brain").then((m) => m.BusinessBrain), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-stage" aria-hidden />,
});

const INDUSTRIES = IndustrySchema.options;
const REVEAL_STAGES = new Set([
  "site_read",
  "services_identified",
  "customers_understood",
  "voice_recognized",
  "scheduling_learned",
  "personality_formed",
  "greeting_ready",
]);

const ease = [0.22, 1, 0.36, 1] as const;

export function DnaExperience() {
  const { events, status, start, reset } = useDnaStream();
  const [form, setForm] = useState({ websiteUrl: "", businessName: "", industry: "", city: "" });
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const picked = useSelectedIndustry();

  // The Industries section sets this when a visitor clicks a vertical card —
  // pre-fill the intake form with it (only while idle, so it never clobbers an
  // in-flight or completed generation).
  useEffect(() => {
    if (picked && status === "idle") {
      setForm((f) => (f.industry === picked ? f : { ...f, industry: picked }));
    }
  }, [picked, status]);

  const latest = events[events.length - 1];
  const dna = useMemo(() => events.find((e) => e.stage === "complete")?.dna, [events]);

  // Re-assert the dormant brain whenever this movement enters view (the earlier
  // journey may have left global progress high on the way down).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The brain is driven ONLY by real events. Dormant when idle + in view.
  useEffect(() => {
    if (status === "idle") {
      if (inView) {
        brainProgress.set(0.06);
        brainFocus.set(null);
      }
      return;
    }
    if (latest) {
      brainProgress.set(latest.progress);
      brainFocus.set(latest.patch?.focus ?? null);
    }
  }, [latest, status, inView]);

  const submit = () => {
    if (!form.websiteUrl && !form.businessName) return;
    start({
      businessName:
        form.businessName ||
        form.websiteUrl.replace(/^https?:\/\//, "").split("/")[0] ||
        "Your Business",
      websiteUrl: form.websiteUrl || undefined,
      industry: form.industry || undefined,
      city: form.city || undefined,
    });
  };

  const insights = events.filter(
    (e) => REVEAL_STAGES.has(e.stage) && (e.patch?.headline || e.patch?.items?.length),
  );

  return (
    <section
      id="dna-experience"
      ref={sectionRef}
      className="relative min-h-[100svh] w-full overflow-hidden bg-stage text-background"
    >
      {/* z-0 contains the brain (and its DOM labels) beneath the reveal content.
          On completion the brain recedes so the DNA reveal reads cleanly. */}
      <div
        className="absolute inset-0 z-0 transition-opacity duration-1000"
        style={{ opacity: status === "done" ? 0.38 : 1 }}
        aria-hidden
      >
        <BusinessBrain variant="hero" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-700"
        style={{
          background:
            "radial-gradient(115% 85% at 50% 42%, transparent 22%, hsl(var(--stage) / 0.9) 100%)",
          opacity: status === "done" ? 1 : 0.85,
        }}
        aria-hidden
      />
      {/* Central readability scrim: darkens the middle where the copy sits so it
          stays legible over the bright brain core, while the outer nodes show through. */}
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "radial-gradient(72% 50% at 50% 50%, hsl(var(--stage) / 0.88) 0%, hsl(var(--stage) / 0.6) 42%, transparent 76%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-5xl flex-col items-center justify-center px-6 py-20 [text-shadow:0_1px_18px_rgba(0,0,0,0.55)]">
        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.6, ease }}
              className="w-full max-w-xl text-center"
            >
              <p className="mb-3 text-xs uppercase tracking-[0.3em]">
                <span className="bg-gradient-to-r from-[#38BDF8] to-[#A855F7] bg-clip-text text-transparent">
                  Before it answers a single call
                </span>
              </p>
              <h2 className="font-sans text-3xl font-medium leading-tight tracking-[-0.02em] sm:text-5xl">
                Watch your AI learn your business
              </h2>
              <p className="mx-auto mt-4 max-w-md text-background/60">
                Enter your website. In seconds, it reads your business and builds its Business DNA —
                live.
              </p>

              <div className="mt-9 rounded-2xl border border-white/10 bg-white/[0.05] p-3 shadow-[0_0_60px_-20px_rgba(56,189,248,0.5)] backdrop-blur-md">
                <input
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="yourbusiness.com"
                  className="w-full rounded-xl bg-transparent px-4 py-3 text-center text-lg text-background outline-none placeholder:text-background/35"
                />
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    placeholder="Business name"
                    className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-background outline-none placeholder:text-background/35 focus:border-[#38BDF8]/50"
                  />
                  <select
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-background/80 outline-none focus:border-[#38BDF8]/50 [&>option]:text-stage"
                  >
                    <option value="">Industry</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i}>
                        {i.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                    className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-background outline-none placeholder:text-background/35 focus:border-[#38BDF8]/50"
                  />
                </div>
                <button
                  onClick={submit}
                  className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#38BDF8] via-[#6D8BFF] to-[#A855F7] py-3 text-sm font-semibold text-white shadow-[0_0_40px_-8px_rgba(120,120,255,0.75)] transition hover:brightness-110"
                >
                  Build my Business DNA
                </button>
              </div>
            </motion.div>
          )}

          {status === "running" && (
            <motion.div
              key="running"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              <div className="mb-6 flex items-center justify-center gap-2 text-sm text-background/70">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE] shadow-[0_0_10px_#22D3EE]" />
                {latest?.label ?? "Analyzing…"}
              </div>
              <ul className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {insights.map((e) => (
                    <motion.li
                      key={e.stage}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease }}
                      className="rounded-xl border border-background/10 bg-background/[0.04] px-4 py-3 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-background">
                        <span className="text-[#38BDF8]">✓</span>
                        {e.label}
                      </div>
                      {e.patch?.headline && (
                        <div className="mt-1 pl-6 text-sm text-background/60">
                          {e.patch.headline}
                        </div>
                      )}
                      {e.patch?.items && e.patch.items.length > 0 && (
                        <div className="mt-1 pl-6 text-sm text-background/50">
                          {e.patch.items.join(" · ")}
                        </div>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </motion.div>
          )}

          {status === "done" && dna && (
            <DnaReveal
              key="reveal"
              dna={dna}
              confidence={latest?.confidence}
              onReset={reset}
              onTalk={() => setCallOpen(true)}
            />
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="text-background/70">The analysis was interrupted.</p>
              <button
                onClick={reset}
                className="mt-4 rounded-full border border-white/20 px-5 py-2 text-sm transition hover:bg-white/10"
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {callOpen && dna && <AvaCall dna={dna} onClose={() => setCallOpen(false)} />}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-white/10 py-4">
      <div className="text-xs uppercase tracking-[0.2em] text-[#7DD3FC]">{label}</div>
      <div className="mt-2 text-background/85">{children}</div>
    </div>
  );
}

function DnaReveal({
  dna,
  confidence,
  onReset,
  onTalk,
}: {
  dna: BusinessDNA;
  confidence?: number;
  onReset: () => void;
  onTalk: () => void;
}) {
  const b = dna.business;
  const emp = dna.employees[0];
  // Reframe raw confidence (evidence gathered) as employee readiness. Even the
  // baseline heuristic yields an employee that can answer calls today; more input
  // just enriches what it knows — so we never show a discouraging low percentage.
  const c = confidence ?? dna.meta.confidence ?? 0;
  const readiness = c >= 0.7 ? "Comprehensive" : c >= 0.5 ? "Strong" : "Ready";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease }}
      className="w-full max-w-3xl"
    >
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em]">
          <span className="bg-gradient-to-r from-[#38BDF8] to-[#A855F7] bg-clip-text text-transparent">
            Business DNA Complete
          </span>
        </p>
        <h2 className="mt-3 font-sans text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
          {b.identity.displayName}
        </h2>
        <p className="mt-2 text-background/55">
          Ready to answer calls · {b.identity.industry.replace(/_/g, " ")}
          {b.identity.city ? ` · ${b.identity.city}` : ""}
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-x-12 sm:grid-cols-2">
        <div>
          <Field label="Business Summary">{b.identity.description ?? b.identity.tagline}</Field>
          <Field label="Core Services">
            {b.knowledge.services.map((s) => s.name).join(", ") || "—"}
          </Field>
          <Field label="Customer Profile">
            {b.industryBehavior.commonIntents.map((i) => i.replace(/_/g, " ")).join(", ")}
          </Field>
          <Field label="Communication Style">
            {emp?.communication.tone.join(", ")} · {emp?.communication.verbosity}
          </Field>
        </div>
        <div>
          <Field label="AI Receptionist Personality">
            {emp?.personality.archetype}
            {emp?.personality.descriptor ? ` — ${emp.personality.descriptor}` : ""}
          </Field>
          <Field label="Suggested Greeting">
            {emp?.communication.greeting ? (
              <span className="italic">“{emp.communication.greeting}”</span>
            ) : (
              "—"
            )}
          </Field>
          <Field label="Appointment Behavior">
            {b.scheduling.appointmentTypes
              .map((a) => `${a.name} (${a.durationMinutes}m)`)
              .join(", ") || "—"}
          </Field>
          <Field label="Knowledge Depth">{readiness}</Field>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-4 text-center">
        <p className="font-sans text-2xl font-medium tracking-[-0.02em] sm:text-3xl">
          Your first AI Employee is ready.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={onTalk}
            className="rounded-full bg-gradient-to-r from-[#38BDF8] via-[#6D8BFF] to-[#A855F7] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_50px_-6px_rgba(120,120,255,0.8)] transition hover:brightness-110"
          >
            Talk to {emp?.name ?? "your AI"}
          </button>
          <button
            onClick={onReset}
            className="text-sm text-background/60 transition hover:text-background"
          >
            Try another business
          </button>
        </div>
      </div>
    </motion.div>
  );
}
