"use client";

import { IndustrySchema, type Industry } from "@operatoros/dna";
import { Reveal } from "../shared/Reveal";
import { Aurora } from "../shared/Aurora";
import { selectedIndustry } from "../dna/selectedIndustry";

const LABELS: Partial<Record<Industry, { name: string; blurb: string }>> = {
  hvac: { name: "HVAC", blurb: "No-heat/no-cool calls dispatched, not lost." },
  golf_course: { name: "Golf Courses", blurb: "Tee times booked around the clock." },
  dental: { name: "Dental", blurb: "New patients booked, emergencies triaged." },
  med_spa: { name: "Med Spas", blurb: "Consultations booked, providers matched." },
  home_services: { name: "Home Services", blurb: "Estimates and dispatch, day or night." },
  medical: { name: "Medical Practices", blurb: "Scheduling that respects HIPAA." },
  legal: { name: "Legal", blurb: "Intake handled, consultations booked." },
  beauty: { name: "Salons & Beauty", blurb: "Stylists matched, chairs filled." },
  restaurant: { name: "Restaurants", blurb: "Reservations and private events." },
  real_estate: { name: "Real Estate", blurb: "Leads qualified, showings booked." },
  fitness: { name: "Fitness & Gyms", blurb: "Intro sessions and tours, on autopilot." },
  automotive: { name: "Automotive", blurb: "Service booked, estimates confirmed." },
  professional_services: { name: "Professional Services", blurb: "Discovery calls, qualified and booked." },
};

const INDUSTRIES = IndustrySchema.options.filter(
  (i): i is keyof typeof LABELS => i !== "general" && i in LABELS,
);

function selectIndustry(industry: Industry) {
  selectedIndustry.set(industry);
  document.getElementById("dna-experience")?.scrollIntoView({ behavior: "smooth" });
}

export function Industries() {
  return (
    <section
      id="industries"
      className="relative w-full overflow-hidden bg-stage px-6 py-28 text-background sm:px-10"
    >
      <Aurora className="absolute inset-0" opacity={0.13} />
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em]">
            <span className="bg-gradient-to-r from-[#38BDF8] to-[#A855F7] bg-clip-text text-transparent">
              Every industry
            </span>
          </p>
          <h2 className="mt-3 font-sans text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
            Built for your business, specifically
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-background/60">
            Pick your industry and SDS pre-loads the vocabulary, compliance, and scheduling
            behavior it needs — then learns the rest from your business.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((industry, i) => {
            const label = LABELS[industry]!;
            return (
              <Reveal key={industry} delay={Math.min(i * 0.04, 0.3)}>
                <button
                  onClick={() => selectIndustry(industry)}
                  className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-5 text-left backdrop-blur-sm transition hover:border-[#38BDF8]/40 hover:bg-white/[0.07] hover:shadow-[0_0_34px_-12px_rgba(56,189,248,0.6)]"
                >
                  <span>
                    <span className="block font-sans text-base font-medium">{label.name}</span>
                    <span className="mt-1 block text-sm text-background/55">{label.blurb}</span>
                  </span>
                  <span
                    aria-hidden
                    className="ml-3 shrink-0 text-background/40 transition group-hover:translate-x-0.5 group-hover:text-[#38BDF8]"
                  >
                    →
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
