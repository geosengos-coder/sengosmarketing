"use client";

import { Reveal } from "../shared/Reveal";
import { Aurora } from "../shared/Aurora";
import { BOOKING_HREF } from "./bookingLink";

export function BookingCta() {
  return (
    <section className="relative w-full overflow-hidden bg-stage px-6 py-32 text-background sm:px-10">
      <Aurora className="absolute inset-0" opacity={0.22} />
      <Reveal className="relative z-10 mx-auto max-w-2xl text-center">
        <h2 className="bg-gradient-to-br from-white via-[#C6D4FF] to-[#B368E8] bg-clip-text font-sans text-3xl font-medium leading-tight tracking-[-0.02em] text-transparent sm:text-5xl">
          Ready to hire your first AI employee?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-background/60">
          See it learn your business live, then talk to it yourself.
        </p>
        <a
          href={BOOKING_HREF}
          className="mt-9 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#38BDF8] via-[#6D8BFF] to-[#A855F7] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_50px_-6px_rgba(120,120,255,0.8)] transition hover:brightness-110"
        >
          Book a demo
        </a>
      </Reveal>
    </section>
  );
}
