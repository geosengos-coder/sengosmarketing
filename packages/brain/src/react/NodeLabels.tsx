import { Html } from "@react-three/drei";
import { satelliteReveal, useBrainProgress } from "../store/progress";
import type { BrainNode } from "../store/types";

/**
 * System labels that fade in as each system connects — the map of the visitor's
 * real business assembling around the AI. Scales with depth; never intercepts input.
 */
export function NodeLabels({ nodes }: { nodes: BrainNode[] }) {
  const p = useBrainProgress();
  const satellites = nodes.filter((n) => n.family !== "intelligence");

  return (
    <>
      {satellites.map((n, i) => {
        const reveal = satelliteReveal(i, satellites.length, p);
        if (reveal < 0.35) return null;
        return (
          <Html
            key={n.id}
            position={n.position}
            center
            distanceFactor={9}
            zIndexRange={[20, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div
              style={{
                transform: "translateY(-20px)",
                opacity: reveal,
                whiteSpace: "nowrap",
                fontFamily: "system-ui, sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(250, 247, 239, 0.62)",
                textShadow: "0 1px 10px rgba(0,0,0,0.7)",
              }}
            >
              {n.label}
            </div>
          </Html>
        );
      })}
    </>
  );
}
