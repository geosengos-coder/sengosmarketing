"use client";

import { Reveal } from "../shared/Reveal";

const FEATURES = [
  {
    title: "Answers every call",
    body: "No hold music, no voicemail. Every caller reaches a receptionist who already knows your business.",
  },
  {
    title: "Books appointments live",
    body: "Real scheduling, confirmed on the call — not a callback promise.",
  },
  {
    title: "Learns your business in seconds",
    body: "Point it at your website and it builds a full Business DNA: services, tone, policies, hours.",
  },
  {
    title: "Escalates like a pro",
    body: "Knows what it doesn't know. Emergencies and edge cases route to a human, cleanly.",
  },
  {
    title: "Works with what you already run",
    body: "No new dashboard to learn — it plugs into your calendar and tools.",
  },
  {
    title: "Always on",
    body: "Nights, weekends, holidays. The front desk that never clocks out.",
  },
];

export function Features() {
  return (
    <section id="features" className="w-full bg-background px-6 py-28 text-foreground sm:px-10">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">What it does</p>
          <h2 className="mt-3 font-sans text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
            One employee, every front-desk job
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={Math.min(i * 0.05, 0.3)}>
              <div className="border-t border-border pt-5">
                <h3 className="font-sans text-lg font-medium tracking-[-0.01em]">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
