"use client";

import { motion, useAnimationFrame, useMotionValue, useSpring, useTransform } from "framer-motion";
import { type RefObject } from "react";
import type { OrbState } from "./orbState";

/**
 * A reusable, self-contained futuristic voice orb. Pure presentation: it renders
 * a state and (optionally) a live audio-amplitude signal — it knows nothing about
 * Retell — so it can front any voice experience.
 *
 * Built from layered glass, glow, and energy elements animated with Framer Motion
 * (no second WebGL context, so it never contends with the Business Brain canvas and
 * stays smooth on mobile). Each state has its own signature motion:
 *   idle → slow breathing glow · connecting → quick pulse · listening → tight pulse
 *   thinking → fast rotating energy · speaking → audio-synced ripples + swelling core.
 */

type Palette = { glow: string; ring: string; core: string; accent: string };

const PALETTE: Record<OrbState, Palette> = {
  // warm brass — brand at rest
  idle: { glow: "#C9A24B", ring: "#D8B968", core: "#F4E4C1", accent: "#EAD6A6" },
  connecting: { glow: "#C9A24B", ring: "#E0C583", core: "#F6E8C8", accent: "#EAD6A6" },
  // cool cyan — mic is live
  listening: { glow: "#35C6E0", ring: "#6FE0EE", core: "#D6F6FF", accent: "#A7ECF5" },
  // indigo — processing
  thinking: { glow: "#7E74F0", ring: "#A99BFF", core: "#E4DBFF", accent: "#C9BEFF" },
  // emerald — agent voice
  speaking: { glow: "#7BE3B0", ring: "#9CEFC8", core: "#D2F9E6", accent: "#B7F2D6" },
  ended: { glow: "#7C7768", ring: "#9A9483", core: "#E4DFD4", accent: "#C9C4B8" },
  error: { glow: "#E0607A", ring: "#F08196", core: "#FFD9DD", accent: "#FFB3BF" },
};

/** Rotation period (s) of the energy ring — fast while thinking, near-still at rest. */
const RING: Record<OrbState, { dur: number; opacity: number }> = {
  idle: { dur: 28, opacity: 0.14 },
  connecting: { dur: 10, opacity: 0.3 },
  listening: { dur: 16, opacity: 0.28 },
  thinking: { dur: 3.4, opacity: 0.7 },
  speaking: { dur: 8, opacity: 0.4 },
  ended: { dur: 44, opacity: 0.08 },
  error: { dur: 18, opacity: 0.3 },
};

/** Breathing of the outer glow — amplitude & tempo per state. */
const GLOW: Record<OrbState, { scale: number[]; opacity: number[]; dur: number }> = {
  idle: { scale: [1, 1.08, 1], opacity: [0.45, 0.65, 0.45], dur: 5.5 },
  connecting: { scale: [1, 1.14, 1], opacity: [0.4, 0.8, 0.4], dur: 1.5 },
  listening: { scale: [1, 1.16, 1], opacity: [0.55, 0.9, 0.55], dur: 1.5 },
  thinking: { scale: [1, 1.07, 1], opacity: [0.5, 0.78, 0.5], dur: 2.4 },
  speaking: { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7], dur: 1.1 },
  ended: { scale: [1, 1.03, 1], opacity: [0.28, 0.4, 0.28], dur: 6.5 },
  error: { scale: [1, 1.05, 1], opacity: [0.5, 0.72, 0.5], dur: 2 },
};

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export interface VoiceOrbProps {
  state: OrbState;
  /** Live agent-audio level (0..1), read per-frame to sync the speaking waveform. */
  amplitudeRef?: RefObject<number>;
  /** CSS size of the orb. Defaults to a responsive value. */
  size?: number | string;
  className?: string;
}

export function VoiceOrb({
  state,
  amplitudeRef,
  size = "min(74vw, 300px)",
  className,
}: VoiceOrbProps) {
  const p = PALETTE[state];
  const active = state === "listening" || state === "speaking" || state === "thinking";

  // Live amplitude → smoothed spring → drives the core swell and inner brightness.
  const raw = useMotionValue(0);
  const amp = useSpring(raw, { stiffness: 260, damping: 24, mass: 0.5 });
  useAnimationFrame(() => {
    const target =
      state === "speaking" ? (amplitudeRef?.current ?? 0) : active ? 0.1 : 0;
    raw.set(Math.min(1, target));
  });
  const coreScale = useTransform(amp, [0, 1], [1, 1.16]);
  const coreGlow = useTransform(amp, [0, 1], [0.5, 1]);
  const rippleScale = useTransform(amp, [0, 1], [1, 1.35]);

  const glow = GLOW[state];
  const ring = RING[state];

  return (
    <div
      className={className}
      style={{ width: size, aspectRatio: "1 / 1", position: "relative", display: "grid", placeItems: "center" }}
      role="img"
      aria-label={`Voice assistant ${state}`}
    >
      {/* 1 — ambient glow (color tweens via box-shadow; pulse via wrapper scale) */}
      <motion.div
        style={{ position: "absolute", width: "42%", height: "42%" }}
        animate={{ scale: glow.scale, opacity: glow.opacity }}
        transition={{ duration: glow.dur, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          style={{ position: "absolute", inset: 0, borderRadius: "9999px" }}
          animate={{ boxShadow: `0 0 90px 40px ${rgba(p.glow, 0.55)}` }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        />
      </motion.div>

      {/* 2 — rotating energy ring (opacity/color cross-fade via CSS transition) */}
      <motion.div
        style={{
          position: "absolute",
          width: "94%",
          height: "94%",
          borderRadius: "9999px",
          opacity: ring.opacity,
          transition: "opacity 0.6s ease",
          background: `conic-gradient(from 0deg, ${rgba(p.ring, 0)} 0%, ${rgba(p.ring, 0)} 12%, ${rgba(p.ring, 0.9)} 46%, ${rgba(p.accent, 0.5)} 60%, ${rgba(p.ring, 0)} 74%, ${rgba(p.ring, 0)} 100%)`,
          WebkitMaskImage:
            "radial-gradient(closest-side, transparent 69%, #000 71%, #000 84%, transparent 86%)",
          maskImage:
            "radial-gradient(closest-side, transparent 69%, #000 71%, #000 84%, transparent 86%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: ring.dur, repeat: Infinity, ease: "linear" }}
      />

      {/* 3a — speaking ripples, sized by live amplitude */}
      {state === "speaking" &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              width: "64%",
              height: "64%",
              borderRadius: "9999px",
              border: `1px solid ${rgba(p.ring, 0.6)}`,
              scale: rippleScale,
            }}
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.9 }}
            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
          />
        ))}

      {/* 3b — listening pulse ring */}
      {(state === "listening" || state === "connecting") && (
        <motion.div
          style={{
            position: "absolute",
            width: "60%",
            height: "60%",
            borderRadius: "9999px",
            border: `1px solid ${rgba(p.ring, 0.55)}`,
          }}
          initial={{ opacity: 0.5, scale: 0.9 }}
          animate={{ opacity: 0, scale: 1.7 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {/* 4 — amplitude scaler → 5 glass core */}
      <motion.div style={{ position: "absolute", width: "60%", height: "60%", scale: coreScale }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: "9999px",
            // Transparent glass body — only a faint top sheen; the glow behind refracts through.
            background:
              "radial-gradient(130% 130% at 30% 20%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 50%)",
            boxShadow:
              "inset 0 2px 22px rgba(255,255,255,0.3), inset 0 -20px 44px rgba(0,0,0,0.5), inset 0 0 60px rgba(255,255,255,0.06), 0 26px 74px rgba(0,0,0,0.55)",
            backdropFilter: "blur(3px) brightness(1.06)",
            WebkitBackdropFilter: "blur(3px) brightness(1.06)",
            overflow: "hidden",
          }}
        >
          {/* refracted inner light — colored core seen through the glass; swells with amplitude */}
          <motion.div
            style={{
              position: "absolute",
              inset: "20%",
              borderRadius: "9999px",
              filter: "blur(11px)",
              opacity: coreGlow,
            }}
            animate={{ backgroundColor: rgba(p.accent, 0.9) }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          />
          {/* colored volume wash pooling toward the base of the sphere */}
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "9999px",
              mixBlendMode: "screen",
              maskImage: "radial-gradient(circle at 50% 70%, #000 0%, transparent 68%)",
              WebkitMaskImage: "radial-gradient(circle at 50% 70%, #000 0%, transparent 68%)",
            }}
            animate={{ backgroundColor: rgba(p.core, 0.4) }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          />
          {/* iridescent prismatic sheen around the rim */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "9999px",
              mixBlendMode: "screen",
              opacity: 0.55,
              background: `conic-gradient(from 210deg, ${rgba(p.ring, 0)}, ${rgba(
                "#8fd8ff",
                0.5,
              )} 18%, ${rgba("#c9a8ff", 0.4)} 40%, ${rgba(p.accent, 0.5)} 64%, ${rgba(
                "#8fffcf",
                0.4,
              )} 82%, ${rgba(p.ring, 0)})`,
              WebkitMaskImage: "radial-gradient(closest-side, transparent 70%, #000 92%)",
              maskImage: "radial-gradient(closest-side, transparent 70%, #000 92%)",
            }}
          />
          {/* Fresnel rim — the bright glass edge that reads as refraction */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "9999px",
              background: `radial-gradient(closest-side, transparent 64%, ${rgba(
                p.accent,
                0.22,
              )} 80%, rgba(255,255,255,0.85) 93%, rgba(255,255,255,0) 100%)`,
            }}
          />
          {/* primary specular highlight (soft, angled) */}
          <div
            style={{
              position: "absolute",
              left: "21%",
              top: "12%",
              width: "32%",
              height: "23%",
              borderRadius: "9999px",
              transform: "rotate(-20deg)",
              background: "radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,255,255,0) 68%)",
              filter: "blur(2px)",
            }}
          />
          {/* secondary crisp glint */}
          <div
            style={{
              position: "absolute",
              left: "31%",
              top: "23%",
              width: "7%",
              height: "7%",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.95)",
              filter: "blur(0.5px)",
            }}
          />
          {/* lower-edge refraction bounce */}
          <div
            style={{
              position: "absolute",
              left: "17%",
              bottom: "9%",
              width: "66%",
              height: "26%",
              borderRadius: "9999px",
              background: "radial-gradient(circle, rgba(255,255,255,0.16), rgba(255,255,255,0) 70%)",
              filter: "blur(7px)",
            }}
          />
        </div>
      </motion.div>

      {/* 6 — crisp outer rim + faint chromatic halo for glass definition */}
      <div
        style={{
          position: "absolute",
          width: "60%",
          height: "60%",
          borderRadius: "9999px",
          border: "1px solid rgba(255,255,255,0.16)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.04), 0 0 24px rgba(255,255,255,0.06) inset",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
