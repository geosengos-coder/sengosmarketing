"use client";

import dynamic from "next/dynamic";

/**
 * The hero. The living Business Brain is showcased in the lower field; the headline
 * sits in clean space above it. Cinematic scrims keep text legible and the
 * composition intentional — the brain is the hero object, never behind the words.
 */
const BusinessBrain = dynamic(() => import("@operatoros/brain").then((m) => m.BusinessBrain), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-stage" aria-hidden />,
});

const navLinks = [
  { label: "Product", href: "#" },
  { label: "AI Employees", href: "#" },
  { label: "Pricing", href: "#" },
];

export function Hero() {
  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-stage text-background">
      {/* Living brain — anchored in the lower field so it never sits behind the headline. */}
      <div className="pointer-events-none absolute inset-x-0 top-[20%] bottom-[-10%]" aria-hidden>
        <BusinessBrain variant="hero" />
      </div>

      {/* Cinematic scrims: dark top for legibility, soft fade into the next section. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-3/5"
        style={{ background: "linear-gradient(to bottom, hsl(var(--stage)) 8%, hsl(var(--stage) / 0.7) 38%, transparent 100%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: "linear-gradient(to top, hsl(var(--stage)) 10%, transparent 100%)" }}
        aria-hidden
      />

      {/* Nav */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="text-[15px] font-semibold tracking-tight">OperatorOS</span>
        <nav className="hidden items-center gap-9 text-sm text-background/55 md:flex">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className="transition-colors hover:text-background">
              {l.label}
            </a>
          ))}
        </nav>
        <a
          href="#"
          className="rounded-full border border-background/20 px-4 py-1.5 text-sm text-background transition-colors hover:bg-background/10"
        >
          Get access
        </a>
      </header>

      {/* Headline — upper, in clean space above the brain. */}
      <div className="relative z-10 flex h-full flex-col items-center px-6 pt-[15vh] text-center">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/[0.04] px-3.5 py-1.5 text-xs text-background/70 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7BE3B0] shadow-[0_0_10px_#7BE3B0]" />
          An AI employee, learning your business in real time
        </div>

        <h1 className="max-w-4xl text-balance font-sans text-[2.6rem] font-medium leading-[1.03] tracking-[-0.03em] sm:text-6xl md:text-7xl">
          The operating system for AI employees
        </h1>

        <p className="mt-7 max-w-lg text-pretty text-base leading-relaxed text-background/60 sm:text-lg">
          Connect your tools and it learns your business — then answers every call, books
          appointments, and follows through. Flawlessly.
        </p>

        <div className="mt-10 flex items-center gap-5">
          <a
            href="#"
            className="rounded-full bg-background px-6 py-3 text-sm font-medium text-stage shadow-[0_0_40px_-8px_rgba(255,255,255,0.35)] transition hover:opacity-90"
          >
            Meet your AI employee
          </a>
          <a href="#" className="text-sm text-background/70 transition-colors hover:text-background">
            See it live&nbsp;→
          </a>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute inset-x-0 bottom-8 z-10 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.3em] text-background/40">
        <span>Scroll</span>
        <span className="inline-block h-px w-10 bg-background/30" />
      </div>
    </section>
  );
}
