"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, Sparkles } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useState } from "react";
import { NodeSystem } from "./NodeSystem";
import { NodeLabels } from "./NodeLabels";
import { StatusStream } from "./StatusStream";
import { ConnectionSystem } from "./ConnectionSystem";
import { FlowParticles } from "./FlowParticles";
import { CameraRig } from "./CameraRig";
import { STAGE_BACKGROUND } from "../config/taxonomy";
import type { BrainConfig } from "../store/types";

/**
 * The WebGL scene root. Cinematic depth (fog + vignette), a luminous core (bloom),
 * and light flowing through the network. Quality auto-scales to hold 60fps.
 */
export function BrainScene({ config }: { config: BrainConfig }) {
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0, 9], fov: 42 }}
      gl={{ antialias: true, alpha: false }}
      style={{ position: "absolute", inset: 0 }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <AdaptiveDpr pixelated={false} />

      <color attach="background" args={[STAGE_BACKGROUND]} />
      <fog attach="fog" args={[STAGE_BACKGROUND, 10, 24]} />

      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 1]} intensity={3} distance={18} color="#EAF0FF" />
      <pointLight position={[6, 4, 6]} intensity={0.7} color="#6D8BFF" />
      <pointLight position={[-6, -3, 4]} intensity={0.4} color="#22D3EE" />

      <Suspense fallback={null}>
        <ConnectionSystem nodes={config.nodes} edges={config.edges} />
        <FlowParticles nodes={config.nodes} edges={config.edges} />
        <NodeSystem nodes={config.nodes} />
        <NodeLabels nodes={config.nodes} />
        <StatusStream nodes={config.nodes} />
        <Sparkles count={90} scale={[18, 12, 10]} size={1.4} speed={0.14} opacity={0.28} color="#C6D4FF" />
      </Suspense>

      <CameraRig />

      <EffectComposer>
        <Bloom
          intensity={0.85}
          luminanceThreshold={0.22}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.72}
        />
        <Vignette offset={0.22} darkness={0.92} eskil={false} />
      </EffectComposer>
    </Canvas>
  );
}
