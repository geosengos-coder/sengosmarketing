"use client";

import { Reveal } from "../shared/Reveal";
import { BOOKING_HREF } from "./bookingLink";

export function BookingCta() {
  return (
    <section className="w-full bg-stage px-6 py-32 text-background sm:px-10">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-sans text-3xl font-medium leading-tight tracking-[-0.02em] sm:text-5xl">
          Ready to hire your first AI employee?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-background/60">
          See it learn your business live, then talk to it yourself.
        </p>
        <a
          href={BOOKING_HREF}
          className="mt-9 inline-flex items-center justify-center rounded-full bg-background px-7 py-3.5 text-sm font-medium text-stage shadow-[0_0_50px_-8px_rgba(255,255,255,0.4)] transition hover:opacity-90"
        >
          Book a demo
        </a>
      </Reveal>
    </section>
  );
}
