import { Html } from "@react-three/drei";
import { useBrainProgress } from "../store/progress";
import type { BrainNode } from "../store/types";

/**
 * The AI thinking out loud beneath the core — the status of whichever system it is
 * currently learning, driven by scroll progress. "It's learning my business," felt.
 */
export function StatusStream({ nodes }: { nodes: BrainNode[] }) {
  const p = useBrainProgress();
  const learners = nodes.filter((n) => n.family !== "intelligence" && n.learning);
  const n = learners.length;

  let text = "Waking…";
  if (p >= 0.84) {
    text = "AI Operating System online";
  } else if (p >= 0.12 && n > 0) {
    const idx = Math.min(n - 1, Math.floor(((p - 0.12) / 0.6) * n));
    text = learners[idx]?.learning ?? text;
  }

  return (
    <Html position={[0, -0.9, 0]} center distanceFactor={7} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div
        style={{
          whiteSpace: "nowrap",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "12px",
          letterSpacing: "0.02em",
          color: "rgba(198, 168, 103, 0.92)",
          textShadow: "0 1px 12px rgba(0,0,0,0.8)",
        }}
      >
        <span style={{ opacity: 0.6 }}>›</span> {text}
      </div>
    </Html>
  );
}
