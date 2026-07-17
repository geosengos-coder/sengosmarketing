"use client";

import { motion } from "framer-motion";

/**
 * Ambient aurora — a few large, slow-drifting color glows that add futuristic
 * energy behind a section. Screen-blended so it reads as light on dark surfaces.
 * Purely decorative and pointer-transparent; drop it into any `relative` parent
 * with an absolutely-positioned wrapper className.
 */
const DEFAULT_COLORS = ["#38BDF8", "#A855F7", "#22D3EE"];

// Placement + drift per blob. Cycled if more colors than layers are supplied.
const LAYERS = [
  { top: "-15%", left: "-10%", x: ["-6%", "10%", "-6%"], y: ["-4%", "8%", "-4%"], dur: 17 },
  { top: "30%", left: "62%", x: ["8%", "-8%", "8%"], y: ["6%", "-6%", "6%"], dur: 21 },
  { top: "68%", left: "8%", x: ["-5%", "7%", "-5%"], y: ["5%", "-7%", "5%"], dur: 19 },
] as const;

export function Aurora({
  colors = DEFAULT_COLORS,
  className,
  opacity = 0.4,
}: {
  colors?: string[];
  className?: string;
  opacity?: number;
}) {
  return (
    <div className={className} style={{ overflow: "hidden", pointerEvents: "none" }} aria-hidden>
      {colors.map((c, i) => {
        const l = LAYERS[i % LAYERS.length]!;
        return (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              width: "58%",
              height: "58%",
              borderRadius: "9999px",
              background: `radial-gradient(circle, ${c}, transparent 68%)`,
              filter: "blur(90px)",
              mixBlendMode: "screen",
              opacity,
              top: l.top,
              left: l.left,
            }}
            animate={{ x: [...l.x], y: [...l.y], scale: [1, 1.18, 1] }}
            transition={{ duration: l.dur, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </div>
  );
}
