import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FAMILY_COLOR } from "../config/taxonomy";
import { brainProgress, satelliteReveal } from "../store/progress";
import type { BrainEdge, BrainNode } from "../store/types";

interface Flow {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  phase: number;
  speed: number;
  srcIndex: number;
}

/**
 * Glowing motes streaming each connected system's data into the core. A flow only
 * appears once its source system has connected (reveal), so the light tracks the story.
 */
export function FlowParticles({ nodes, edges }: { nodes: BrainNode[]; edges: BrainEdge[] }) {
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const satIndex = useMemo(() => {
    const m = new Map<string, number>();
    nodes.filter((n) => n.family !== "intelligence").forEach((n, i) => m.set(n.id, i));
    return m;
  }, [nodes]);
  const total = satIndex.size;

  const flows = useMemo<Flow[]>(() => {
    const out: Flow[] = [];
    edges.forEach((e, i) => {
      const a = byId.get(e.source);
      const b = byId.get(e.target);
      if (!a || !b) return;
      const [src, dst] = a.family === "intelligence" ? [b, a] : [a, b];
      const famColor = FAMILY_COLOR[src.family === "intelligence" ? dst.family : src.family];
      out.push({
        from: new THREE.Vector3(...src.position),
        to: new THREE.Vector3(...dst.position),
        color: famColor,
        phase: (i * 0.41) % 1,
        speed: 0.11 + (i % 4) * 0.02,
        srcIndex: satIndex.get(src.id) ?? 0,
      });
    });
    return out;
  }, [edges, byId, satIndex]);

  const meshes = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const p = brainProgress.get();
    for (let i = 0; i < flows.length; i++) {
      const mesh = meshes.current[i];
      const f = flows[i];
      if (!mesh || !f) continue;
      const reveal = satelliteReveal(f.srcIndex, total, p);
      const tt = (t * f.speed + f.phase) % 1;
      mesh.position.lerpVectors(f.from, f.to, tt);
      const fade = Math.sin(tt * Math.PI) * reveal;
      mesh.scale.setScalar(0.03 + fade * 0.05);
      (mesh.material as THREE.MeshBasicMaterial).opacity = fade * 0.85;
    }
  });

  return (
    <group>
      {flows.map((f, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshes.current[i] = m;
          }}
        >
          <sphereGeometry args={[1, 10, 10]} />
          <meshBasicMaterial color={f.color} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
