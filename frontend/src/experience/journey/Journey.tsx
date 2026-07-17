"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { useBrainProgress } from "@operatoros/brain";
import { useScrollProgress } from "./useScrollProgress";
import { SdsLogo } from "../shared/SdsLogo";
import { Aurora } from "../shared/Aurora";

const BusinessBrain = dynamic(() => import("@operatoros/brain").then((m) => m.BusinessBrain), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-stage" aria-hidden />,
});

const navLinks = [
  { label: "Product", href: "#features" },
  { label: "Industries", href: "#industries" },
  { label: "Pricing", href: "#pricing" },
];

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Copy that cross-fades with scroll: intro → "it's learning" → "it's awake". */
function JourneyCopy() {
  const p = useBrainProgress();
  const introOpacity = 1 - smoothstep(0.05, 0.16, p);
  const learnOpacity = smoothstep(0.12, 0.2, p) * (1 - smoothstep(0.76, 0.86, p));
  const wakeOpacity = smoothstep(0.82, 0.92, p);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Beat 1 — the operating system */}
      <div
        className="absolute inset-x-0 top-0 flex flex-col items-center px-6 pt-[15vh] text-center"
        style={{ opacity: introOpacity }}
      >
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs text-background/80 shadow-[0_0_30px_-8px_rgba(56,189,248,0.6)] backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_10px_#22D3EE]" />
          An AI employee, learning your business in real time
        </div>
        <h1 className="max-w-4xl text-balance bg-gradient-to-br from-white via-[#C6D4FF] to-[#B368E8] bg-clip-text text-[2.6rem] font-medium leading-[1.03] tracking-[-0.03em] text-transparent sm:text-6xl md:text-7xl">
          The operating system for AI employees
        </h1>
        <p className="mt-7 max-w-lg text-pretty text-base leading-relaxed text-background/60 sm:text-lg">
          Connect your tools and it learns your business — then answers every call, books
          appointments, and follows through. Flawlessly.
        </p>
        <div className="pointer-events-auto mt-10 flex items-center gap-5">
          <a
            href="#dna-experience"
            className="rounded-full bg-gradient-to-r from-[#38BDF8] via-[#6D8BFF] to-[#A855F7] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_44px_-6px_rgba(120,120,255,0.75)] transition hover:brightness-110"
          >
            Meet your AI employee
          </a>
          <a
            href="#dna-experience"
            className="text-sm text-background/70 transition-colors hover:text-background"
          >
            See it live&nbsp;→
          </a>
        </div>
      </div>

      {/* Beat 2 — it's learning */}
      <div
        className="absolute inset-x-0 top-0 flex flex-col items-center px-6 pt-[12vh] text-center"
        style={{ opacity: learnOpacity }}
      >
        <h2 className="max-w-2xl text-2xl font-medium leading-tight tracking-[-0.02em] text-background/90 sm:text-4xl">
          Every system you run,
          <br />
          becoming one intelligence.
        </h2>
      </div>

      {/* Beat 3 — it's awake */}
      <div
        className="absolute inset-x-0 top-0 flex flex-col items-center px-6 pt-[13vh] text-center"
        style={{ opacity: wakeOpacity }}
      >
        <h2 className="max-w-3xl bg-gradient-to-br from-white via-[#C6D4FF] to-[#B368E8] bg-clip-text text-3xl font-medium leading-[1.05] tracking-[-0.02em] text-transparent sm:text-5xl">
          Your AI Operating System is awake.
        </h2>
        <p className="mt-5 max-w-md text-base text-background/60 sm:text-lg">
          It knows your business. Now let it run the front desk.
        </p>
        <div className="pointer-events-auto mt-9">
          <a
            href="#dna-experience"
            className="rounded-full bg-gradient-to-r from-[#38BDF8] via-[#6D8BFF] to-[#A855F7] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_50px_-6px_rgba(120,120,255,0.8)] transition hover:brightness-110"
          >
            Talk to your AI employee
          </a>
        </div>
      </div>
    </div>
  );
}

export function Journey() {
  const trackRef = useRef<HTMLDivElement>(null);
  useScrollProgress(trackRef);

  return (
    <section ref={trackRef} className="relative h-[500vh] bg-stage text-background">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* The living brain fills the frame; systems assemble as you scroll. */}
        <div className="absolute inset-0" aria-hidden>
          <BusinessBrain variant="hero" />
        </div>

        {/* Aurora — futuristic color energy drifting over the stage. */}
        <Aurora className="absolute inset-0 z-[1]" opacity={0.32} />

        {/* Cinematic scrims for legibility. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-2/5"
          style={{ background: "linear-gradient(to bottom, hsl(var(--stage)) 6%, transparent 100%)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4"
          style={{ background: "linear-gradient(to top, hsl(var(--stage)) 8%, transparent 100%)" }}
          aria-hidden
        />

        {/* Nav */}
        <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10">
          <SdsLogo size={26} className="text-[15px]" />
          <nav className="hidden items-center gap-9 text-sm text-background/55 md:flex">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="transition-colors hover:text-background">
                {l.label}
              </a>
            ))}
          </nav>
          <a
            href="#dna-experience"
            className="rounded-full border border-background/20 px-4 py-1.5 text-sm text-background transition-colors hover:bg-background/10"
          >
            Get access
          </a>
        </header>

        <JourneyCopy />

        <div className="absolute inset-x-0 bottom-8 z-10 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.3em] text-background/40">
          <span>Scroll</span>
          <span className="inline-block h-px w-10 bg-background/30" />
        </div>
      </div>
    </section>
  );
}
