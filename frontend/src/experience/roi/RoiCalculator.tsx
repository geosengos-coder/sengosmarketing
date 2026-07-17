"use client";

import { useState } from "react";
import { Reveal } from "../shared/Reveal";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="font-sans text-lg font-medium">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-primary"
      />
    </label>
  );
}

export function RoiCalculator() {
  const [missedCalls, setMissedCalls] = useState(40);
  const [jobValue, setJobValue] = useState(300);
  const [closeRate, setCloseRate] = useState(35);

  const recovered = Math.round(missedCalls * jobValue * (closeRate / 100));

  return (
    <section id="roi" className="w-full bg-stage px-6 py-28 text-background sm:px-10">
      <div className="mx-auto max-w-4xl">
        <Reveal className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-brass">Missed calls, priced</p>
          <h2 className="mt-3 font-sans text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
            What are missed calls costing you?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-background/60">
            An estimate, not a promise — adjust the assumptions to match your business.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2">
          <div className="space-y-8 rounded-2xl border border-background/12 bg-background/[0.03] p-6 backdrop-blur-sm">
            <Slider
              label="Missed calls per month"
              value={missedCalls}
              min={0}
              max={200}
              step={5}
              format={(v) => String(v)}
              onChange={setMissedCalls}
            />
            <Slider
              label="Average job value"
              value={jobValue}
              min={50}
              max={2000}
              step={25}
              format={(v) => currency.format(v)}
              onChange={setJobValue}
            />
            <Slider
              label="Close rate"
              value={closeRate}
              min={5}
              max={80}
              step={5}
              format={(v) => `${v}%`}
              onChange={setCloseRate}
            />
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-background/12 bg-background/[0.03] p-6 text-center backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-brass">Estimated revenue recovered</p>
            <p className="mt-3 font-sans text-5xl font-medium tracking-[-0.02em]">
              {currency.format(recovered)}
            </p>
            <p className="mt-2 text-sm text-background/50">per month</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
