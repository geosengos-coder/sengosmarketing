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
    <section id="pricing" className="w-full bg-background px-6 py-28 text-foreground sm:px-10">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Pricing</p>
          <h2 className="mt-3 font-sans text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
            Simple, per-employee pricing
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Illustrative starting prices — final pricing is scoped to your call volume on a demo call.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 0.06}>
              <div
                className={`flex h-full flex-col rounded-2xl border p-7 ${
                  tier.featured ? "border-primary bg-primary/5" : "border-border bg-muted/30"
                }`}
              >
                <h3 className="font-sans text-lg font-medium">{tier.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{tier.blurb}</p>
                <p className="mt-6 font-sans text-4xl font-medium tracking-[-0.02em]">
                  {tier.price}
                  <span className="text-base font-normal text-muted-foreground">{tier.period}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm text-muted-foreground">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 text-primary">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={BOOKING_HREF}
                  className={`mt-8 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition ${
                    tier.featured
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "border border-border hover:bg-muted"
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
