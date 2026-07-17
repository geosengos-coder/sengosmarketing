"use client";

import { useState } from "react";
import { Reveal } from "../shared/Reveal";
import { Aurora } from "../shared/Aurora";

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
        <span className="text-sm text-background/60">{label}</span>
        <span className="font-sans text-lg font-medium">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-[#38BDF8]"
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
    <section
      id="roi"
      className="relative w-full overflow-hidden bg-stage px-6 py-28 text-background sm:px-10"
    >
      <Aurora className="absolute inset-0" colors={["#A855F7", "#38BDF8", "#F472B6"]} opacity={0.14} />
      <div className="relative z-10 mx-auto max-w-4xl">
        <Reveal className="text-center">
          <p className="text-xs uppercase tracking-[0.3em]">
            <span className="bg-gradient-to-r from-[#38BDF8] to-[#A855F7] bg-clip-text text-transparent">
              Missed calls, priced
            </span>
          </p>
          <h2 className="mt-3 font-sans text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
            What are missed calls costing you?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-background/60">
            An estimate, not a promise — adjust the assumptions to match your business.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2">
          <div className="space-y-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
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

          <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#38BDF8]/25 bg-gradient-to-b from-[#38BDF8]/[0.10] to-transparent p-6 text-center backdrop-blur-sm shadow-[0_0_50px_-16px_rgba(56,189,248,0.6)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7DD3FC]">Estimated revenue recovered</p>
            <p className="mt-3 bg-gradient-to-br from-white via-[#C6D4FF] to-[#B368E8] bg-clip-text font-sans text-5xl font-medium tracking-[-0.02em] text-transparent">
              {currency.format(recovered)}
            </p>
            <p className="mt-2 text-sm text-background/50">per month</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
