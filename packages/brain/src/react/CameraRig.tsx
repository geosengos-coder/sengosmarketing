import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { brainProgress } from "../store/progress";

/**
 * Calm, organic camera motion — a slow drift plus subtle pointer parallax, and a
 * gentle dolly *toward* the mind as the journey progresses (moving through a film).
 */
export function CameraRig() {
  const { camera, pointer } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 10.6));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const p = brainProgress.get();
    const z = 10.6 - p * 2.4; // far when dormant → closer as it wakes
    const x = Math.sin(t * 0.08) * 0.7 + pointer.x * 0.9;
    const y = Math.cos(t * 0.1) * 0.4 + pointer.y * 0.5;
    target.current.set(x, y, z);
    camera.position.lerp(target.current, 0.02);
    camera.lookAt(0, 0, 0);
  });

  return null;
}
