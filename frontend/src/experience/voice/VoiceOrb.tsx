"use client";

import { motion, useAnimationFrame, useMotionValue, useSpring, useTransform } from "framer-motion";
import { type RefObject } from "react";
import type { OrbState } from "./orbState";

/**
 * A reusable, Siri-style voice orb. Pure presentation: it renders a state and
 * (optionally) a live audio-amplitude signal — it knows nothing about Retell — so
 * it can front any voice experience.
 *
 * Four large color blobs drift and blend (screen-mode) inside a clipped sphere to
 * make fluid, iridescent light; a crisp rim keeps the edge sharp. Built entirely
 * with layered gradients + Framer Motion (no second WebGL context, so it never
 * contends with the Business Brain canvas and stays smooth on mobile). Each state
 * has its own palette and tempo: idle drifts calmly, thinking swirls fast,
 * speaking goes full-spectrum and reacts to the live agent audio.
 */

type Palette = { blobs: [string, string, string, string]; rim: string; halo: string };

const PALETTE: Record<OrbState, Palette> = {
  idle: { blobs: ["#4C7DFF", "#6D6BFF", "#9B6BFF", "#B57BFF"], rim: "#C6D4FF", halo: "#6D7BFF" },
  connecting: { blobs: ["#4C7DFF", "#6D6BFF", "#9B6BFF", "#FFB86B"], rim: "#CFE0FF", halo: "#6D8BFF" },
  listening: { blobs: ["#22D3EE", "#38BDF8", "#3B82F6", "#22B8D8"], rim: "#C7F6FF", halo: "#22C7EE" },
  thinking: { blobs: ["#A855F7", "#D946EF", "#8B5CF6", "#6366F1"], rim: "#E9CCFF", halo: "#A855F7" },
  speaking: { blobs: ["#38BDF8", "#818CF8", "#C084FC", "#F472B6"], rim: "#EAD6FF", halo: "#B368E8" },
  ended: { blobs: ["#7C8BA0", "#5A6577", "#94A3B8", "#414c5e"], rim: "#C7CED8", halo: "#64748B" },
  error: { blobs: ["#FB7185", "#F43F5E", "#FB923C", "#E11D48"], rim: "#FFD3D9", halo: "#F43F5E" },
};

/** Motion tempo multiplier — lower is faster. thinking swirls; ended barely moves. */
const TEMPO: Record<OrbState, number> = {
  idle: 1,
  connecting: 0.7,
  listening: 0.75,
  thinking: 0.42,
  speaking: 0.6,
  ended: 1.8,
  error: 0.8,
};

/** Breathing of the outer halo. */
const HALO: Record<OrbState, { scale: number[]; opacity: number[]; dur: number }> = {
  idle: { scale: [1, 1.09, 1], opacity: [0.5, 0.72, 0.5], dur: 5.5 },
  connecting: { scale: [1, 1.14, 1], opacity: [0.45, 0.85, 0.45], dur: 1.6 },
  listening: { scale: [1, 1.16, 1], opacity: [0.6, 0.95, 0.6], dur: 1.6 },
  thinking: { scale: [1, 1.08, 1], opacity: [0.55, 0.85, 0.55], dur: 2.2 },
  speaking: { scale: [1, 1.13, 1], opacity: [0.75, 1, 0.75], dur: 1.0 },
  ended: { scale: [1, 1.03, 1], opacity: [0.3, 0.42, 0.3], dur: 6.5 },
  error: { scale: [1, 1.06, 1], opacity: [0.55, 0.8, 0.55], dur: 2 },
};

// Per-blob drift paths (percent of the orb) — wide, out-of-phase orbits so the
// color stays spread out and swirling rather than piling into a white center.
const BLOBS = [
  { x: ["-24%", "18%", "-10%", "-24%"], y: ["-18%", "12%", "24%", "-18%"], s: [1, 1.25, 0.9, 1], dur: 9 },
  { x: ["22%", "-20%", "10%", "22%"], y: ["-12%", "20%", "-22%", "-12%"], s: [1.15, 0.9, 1.25, 1.15], dur: 11 },
  { x: ["-14%", "24%", "-22%", "-14%"], y: ["20%", "-14%", "12%", "20%"], s: [0.9, 1.2, 1.08, 0.9], dur: 8 },
  { x: ["18%", "-10%", "24%", "18%"], y: ["18%", "-22%", "-8%", "18%"], s: [1.2, 1, 1.25, 1.2], dur: 10.5 },
] as const;

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export interface VoiceOrbProps {
  state: OrbState;
  /** Live agent-audio level (0..1), read per-frame to sync the speaking response. */
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
  const tempo = TEMPO[state];
  const halo = HALO[state];
  const active = state === "listening" || state === "speaking" || state === "thinking";

  // Live amplitude → smoothed spring → drives the sphere swell and core brightness.
  const raw = useMotionValue(0);
  const amp = useSpring(raw, { stiffness: 260, damping: 24, mass: 0.5 });
  useAnimationFrame(() => {
    const target = state === "speaking" ? (amplitudeRef?.current ?? 0) : active ? 0.12 : 0;
    raw.set(Math.min(1, target));
  });
  const sphereScale = useTransform(amp, [0, 1], [1, 1.14]);
  const coreGlow = useTransform(amp, [0, 1], [0.06, 0.28]);
  const rippleScale = useTransform(amp, [0, 1], [1, 1.3]);

  return (
    <div
      className={className}
      style={{ width: size, aspectRatio: "1 / 1", position: "relative", display: "grid", placeItems: "center" }}
      role="img"
      aria-label={`Voice assistant ${state}`}
    >
      {/* 1 — outer color halo (breathes; color tweens on state change) */}
      <motion.div
        style={{ position: "absolute", width: "48%", height: "48%" }}
        animate={{ scale: halo.scale, opacity: halo.opacity }}
        transition={{ duration: halo.dur, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          style={{ position: "absolute", inset: 0, borderRadius: "9999px" }}
          animate={{ boxShadow: `0 0 100px 46px ${rgba(p.halo, 0.5)}` }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        />
      </motion.div>

      {/* 2 — speaking ripples / listening pulse */}
      {state === "speaking" &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              width: "58%",
              height: "58%",
              borderRadius: "9999px",
              border: `1px solid ${rgba(p.rim, 0.55)}`,
              scale: rippleScale,
            }}
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.9 }}
            transition={{ duration: 2.1, repeat: Infinity, delay: i * 0.66, ease: "easeOut" }}
          />
        ))}
      {(state === "listening" || state === "connecting") && (
        <motion.div
          style={{
            position: "absolute",
            width: "56%",
            height: "56%",
            borderRadius: "9999px",
            border: `1px solid ${rgba(p.rim, 0.5)}`,
          }}
          initial={{ opacity: 0.5, scale: 0.92 }}
          animate={{ opacity: 0, scale: 1.7 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {/* 3 — the sphere: clipped fluid color + crisp rim (swells with amplitude) */}
      <motion.div
        style={{
          position: "absolute",
          width: "56%",
          height: "56%",
          borderRadius: "9999px",
          overflow: "hidden",
          scale: sphereScale,
          // deep base so screen-blended blobs read as glowing light
          background: "radial-gradient(circle at 50% 50%, #0b0b16 0%, #050509 78%)",
          boxShadow: `inset 0 0 40px rgba(0,0,0,0.6), 0 20px 70px ${rgba(p.halo, 0.4)}`,
        }}
      >
        {/* drifting color blobs — capped brightness so overlaps glow without blowing to white */}
        {BLOBS.map((b, i) => {
          const c = p.blobs[i] ?? p.blobs[0];
          return (
            <motion.div
              key={i}
              style={{
                position: "absolute",
                inset: "14%",
                borderRadius: "9999px",
                mixBlendMode: "screen",
                filter: "blur(13px) saturate(1.5)",
                background: `radial-gradient(circle at 50% 50%, ${rgba(c, 0.9)} 0%, ${rgba(c, 0.35)} 38%, ${rgba(c, 0)} 66%)`,
              }}
              animate={{ x: [...b.x], y: [...b.y], scale: [...b.s] }}
              transition={{ duration: b.dur * tempo, repeat: Infinity, ease: "easeInOut" }}
            />
          );
        })}

        {/* small central bloom — a bright highlight that flares with live audio */}
        <motion.div
          style={{
            position: "absolute",
            inset: "36%",
            borderRadius: "9999px",
            background: "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.9), rgba(255,255,255,0) 72%)",
            filter: "blur(7px)",
            mixBlendMode: "screen",
            opacity: coreGlow,
          }}
        />

        {/* spherical shading for depth */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "9999px",
            background:
              "radial-gradient(circle at 50% 38%, transparent 50%, rgba(0,0,0,0.5) 100%)",
            mixBlendMode: "multiply",
          }}
        />

        {/* crisp bright rim — the sharp glass edge */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "9999px",
            background: `radial-gradient(closest-side, transparent 82%, ${rgba(p.rim, 0.5)} 92%, rgba(255,255,255,0.9) 98%, rgba(255,255,255,0) 100%)`,
          }}
        />

        {/* top specular glint — subtle, keeps the surface reading as glass */}
        <div
          style={{
            position: "absolute",
            left: "26%",
            top: "14%",
            width: "22%",
            height: "14%",
            borderRadius: "9999px",
            transform: "rotate(-18deg)",
            background: "radial-gradient(circle, rgba(255,255,255,0.6), rgba(255,255,255,0) 72%)",
            filter: "blur(3px)",
          }}
        />
      </motion.div>

      {/* 4 — outer definition ring */}
      <motion.div
        style={{
          position: "absolute",
          width: "56%",
          height: "56%",
          borderRadius: "9999px",
          pointerEvents: "none",
          scale: sphereScale,
        }}
        animate={{ boxShadow: `0 0 0 1px ${rgba(p.rim, 0.25)}, 0 0 30px ${rgba(p.halo, 0.35)}` }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      />
    </div>
  );
}
