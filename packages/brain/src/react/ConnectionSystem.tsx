import { Line } from "@react-three/drei";
import { satelliteReveal, useBrainProgress } from "../store/progress";
import type { BrainEdge, BrainNode } from "../store/types";

/** Threads that draw in as each system connects (opacity follows the source's reveal). */
export function ConnectionSystem({ nodes, edges }: { nodes: BrainNode[]; edges: BrainEdge[] }) {
  const p = useBrainProgress();
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const satellites = nodes.filter((n) => n.family !== "intelligence");
  const revealById = new Map(satellites.map((n, i) => [n.id, satelliteReveal(i, satellites.length, p)]));

  return (
    <group>
      {edges.map((e) => {
        const a = byId.get(e.source);
        const b = byId.get(e.target);
        if (!a || !b) return null;
        const reveal = revealById.get(e.source) ?? revealById.get(e.target) ?? 0;
        if (reveal < 0.05) return null;
        return (
          <Line
            key={e.id}
            points={[a.position, b.position]}
            color="#6D8BFF"
            transparent
            opacity={0.14 * reveal}
            lineWidth={1}
          />
        );
      })}
    </group>
  );
}
