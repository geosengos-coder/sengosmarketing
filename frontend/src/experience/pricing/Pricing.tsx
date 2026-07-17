"use client";

import { Reveal } from "../shared/Reveal";
import { BOOKING_HREF } from "../cta/bookingLink";

const TIERS = [
  {
    name: "Starter",
    price: "$299",
    period: "/mo",
    blurb: "One AI employee, one location.",
    features: ["Live call answering", "Appointment booking", "Business DNA from your website", "Email support"],
  },
  {
    name: "Growth",
    price: "$699",
    period: "/mo",
    blurb: "For businesses ready to scale the front desk.",
    features: [
      "Everything in Starter",
      "Multiple AI employee roles",
      "Priority escalation routing",
      "Calendar & tool integrations",
      "Priority support",
    ],
    featured: true,
  },
  {
    name: "Scale",
    price: "Custom",
    period: "",
    blurb: "Multi-location or high call volume.",
    features: [
      "Everything in Growth",
      "Multi-location rollout",
      "Custom integrations",
      "Dedicated onboarding",
    ],
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative w-full overflow-hidden bg-stage px-6 py-28 text-background sm:px-10"
    >
      <div className="relative z-10 mx-auto max-w-5xl">
        <Reveal className="text-center">
          <p className="text-xs uppercase tracking-[0.3em]">
            <span className="bg-gradient-to-r from-[#38BDF8] to-[#A855F7] bg-clip-text text-transparent">
              Pricing
            </span>
          </p>
          <h2 className="mt-3 font-sans text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
            Simple, per-employee pricing
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-background/60">
            Illustrative starting prices — final pricing is scoped to your call volume on a demo call.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 0.06}>
              <div
                className={`flex h-full flex-col rounded-2xl border p-7 backdrop-blur-sm transition ${
                  tier.featured
                    ? "border-[#38BDF8]/45 bg-gradient-to-b from-[#38BDF8]/[0.12] to-transparent shadow-[0_0_60px_-18px_rgba(56,189,248,0.7)]"
                    : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]"
                }`}
              >
                <h3 className="font-sans text-lg font-medium">{tier.name}</h3>
                <p className="mt-2 text-sm text-background/55">{tier.blurb}</p>
                <p className="mt-6 font-sans text-4xl font-medium tracking-[-0.02em]">
                  {tier.price}
                  <span className="text-base font-normal text-background/50">{tier.period}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm text-background/60">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 text-[#38BDF8]">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={BOOKING_HREF}
                  className={`mt-8 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition ${
                    tier.featured
                      ? "bg-gradient-to-r from-[#38BDF8] to-[#A855F7] text-white shadow-[0_0_30px_-8px_rgba(120,120,255,0.8)] hover:brightness-110"
                      : "border border-white/15 text-background hover:bg-white/10"
                  }`}
                >
                  Book a demo
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
