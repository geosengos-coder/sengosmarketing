"use client";

import { Reveal } from "../shared/Reveal";

/**
 * No paying customers yet — these are illustrative example outcomes by role/
 * industry, not attributed reviews. Swap in real quotes as pilots land.
 */
const OUTCOMES = [
  {
    quote:
      "Every call used to hit voicemail after hours. Now the after-hours calls get answered and booked before we open.",
    role: "Owner, HVAC company",
  },
  {
    quote:
      "It knew our services and pricing structure within a minute of reading our site. Patients don't notice it isn't a person.",
    role: "Office manager, dental practice",
  },
  {
    quote:
      "Tee times used to tie up the pro shop phone all morning. Now the phone answers itself.",
    role: "General manager, golf course",
  },
];

export function Testimonials() {
  return (
    <section className="relative w-full overflow-hidden bg-stage px-6 py-28 text-background sm:px-10">
      <div className="relative z-10 mx-auto max-w-5xl">
        <Reveal className="text-center">
          <p className="text-xs uppercase tracking-[0.3em]">
            <span className="bg-gradient-to-r from-[#38BDF8] to-[#A855F7] bg-clip-text text-transparent">
              Early outcomes
            </span>
          </p>
          <h2 className="mt-3 font-sans text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
            What this looks like in practice
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-background/60">
            Illustrative pilot feedback — not attributed customer reviews.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {OUTCOMES.map((o, i) => (
            <Reveal key={o.role} delay={i * 0.06}>
              <figure className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition hover:border-[#A855F7]/40 hover:shadow-[0_0_34px_-12px_rgba(168,85,247,0.6)]">
                <blockquote className="text-sm leading-relaxed text-background/90">
                  “{o.quote}”
                </blockquote>
                <figcaption className="mt-4 text-xs uppercase tracking-[0.15em] text-background/50">
                  {o.role}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
