import { Float } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { FAMILY_COLOR, FAMILY_RADIUS } from "../config/taxonomy";
import { brainFocus, brainProgress, satelliteReveal, smoothstep } from "../store/progress";
import type { BrainNode } from "../store/types";

const damp = (current: number, target: number, delta: number, rate = 4) =>
  current + (target - current) * Math.min(1, delta * rate);

/** The AI Operating System — brightens as it learns; pulses when it's the focus; flashes at activation. */
function CoreNode({ node }: { node: BrainNode }) {
  const color = FAMILY_COLOR.intelligence;
  const r = FAMILY_RADIUS.intelligence;
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const halo = useRef<THREE.MeshBasicMaterial>(null);
  const focusAmt = useRef(0);

  useFrame((state, delta) => {
    const p = brainProgress.get();
    focusAmt.current = damp(focusAmt.current, brainFocus.get() === "core" ? 1 : 0, delta);
    const base = 0.5 + p * 1.5;
    const breathe = 0.12 * Math.sin(state.clock.elapsedTime * 1.4);
    const activation = smoothstep(0.86, 1, p) * 0.8;
    if (mat.current) mat.current.emissiveIntensity = base + breathe + activation + focusAmt.current * 0.7;
    if (halo.current) halo.current.opacity = 0.05 + p * 0.05 + activation * 0.06 + focusAmt.current * 0.05;
  });

  return (
    <Float speed={0.5} rotationIntensity={0} floatIntensity={0.15} floatingRange={[-0.06, 0.06]}>
      <group position={node.position}>
        <mesh>
          <sphereGeometry args={[r, 48, 48]} />
          <meshStandardMaterial
            ref={mat}
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            roughness={0.15}
            metalness={0}
            toneMapped={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[r * 1.9, 32, 32]} />
          <meshBasicMaterial ref={halo} color={color} transparent opacity={0.06} toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
    </Float>
  );
}

/** A business system that emerges as it connects and swells when the AI is learning it. */
function Satellite({ node, index, total }: { node: BrainNode; index: number; total: number }) {
  const color = FAMILY_COLOR[node.family];
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const focusAmt = useRef(0);

  useFrame((_, delta) => {
    const reveal = satelliteReveal(index, total, brainProgress.get());
    focusAmt.current = damp(focusAmt.current, brainFocus.get() === node.id ? 1 : 0, delta);
    const f = focusAmt.current;
    if (group.current) group.current.scale.setScalar(reveal * (1 + f * 0.35));
    if (mat.current) {
      mat.current.opacity = reveal;
      mat.current.emissiveIntensity = 1.2 * reveal * (1 + f * 0.85);
    }
  });

  return (
    <Float speed={1.1} rotationIntensity={0} floatIntensity={0.8} floatingRange={[-0.14, 0.14]}>
      <group ref={group} scale={0}>
        <mesh position={node.position}>
          <sphereGeometry args={[FAMILY_RADIUS[node.family], 32, 32]} />
          <meshStandardMaterial
            ref={mat}
            color={color}
            emissive={color}
            emissiveIntensity={0}
            roughness={0.25}
            metalness={0}
            toneMapped={false}
            transparent
            opacity={0}
          />
        </mesh>
      </group>
    </Float>
  );
}

export function NodeSystem({ nodes }: { nodes: BrainNode[] }) {
  const satellites = nodes.filter((n) => n.family !== "intelligence");
  const core = nodes.find((n) => n.family === "intelligence");
  return (
    <group>
      {core && <CoreNode node={core} />}
      {satellites.map((n, i) => (
        <Satellite key={n.id} node={n} index={i} total={satellites.length} />
      ))}
    </group>
  );
}
