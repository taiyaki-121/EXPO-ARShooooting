"use client";

import { Component, ReactNode, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { BossDef } from "./game-data";

// Teacher 3D models: drop a glTF binary at public/models/<boss id>.glb
// (e.g. public/models/yagi.glb). Until the file exists the emoji is shown instead.
export const modelUrl = (bossId: string) => `/models/${bossId}.glb`;

// Models are auto-scaled to this height and centered, so any export size works
const TARGET_HEIGHT = 2.2;

function Model({ url, dodging }: { url: string; dodging: boolean }) {
  const gltf = useLoader(GLTFLoader, url);
  const group = useRef<THREE.Group>(null);

  // Clone so a re-entered battle doesn't reuse a scene already attached elsewhere
  const scene = useMemo(() => {
    const root = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = TARGET_HEIGHT / Math.max(size.y, 0.001);
    root.scale.setScalar(scale);
    root.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    return root;
  }, [gltf]);

  // Play the model's first animation (idle etc.) if it has one
  const mixer = useMemo(() => {
    if (gltf.animations.length === 0) return null;
    const m = new THREE.AnimationMixer(scene);
    m.clipAction(gltf.animations[0]).play();
    return m;
  }, [gltf, scene]);

  useEffect(
    () => () => {
      mixer?.stopAllAction();
    },
    [mixer]
  );

  useFrame((state, delta) => {
    mixer?.update(delta);
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.position.y = Math.sin(t * 2) * 0.08; // gentle float, like the emoji
    g.rotation.y = Math.sin(t * 0.6) * 0.35;
    // Dodging: the teacher drifts away a little
    g.position.z += ((dodging ? -1.2 : 0) - g.position.z) * Math.min(1, delta * 8);
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

class ModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("Teacher model failed to load", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

type Availability = "checking" | "model" | "none";

// Shows the teacher's 3D model over the camera feed, or the emoji when no model exists.
export default function TeacherModel({ boss, dodging }: { boss: BossDef; dodging: boolean }) {
  const url = modelUrl(boss.id);
  const [availability, setAvailability] = useState<Availability>("checking");

  // HEAD first so a missing model quietly falls back instead of throwing a loader error
  useEffect(() => {
    let cancelled = false;
    fetch(url, { method: "HEAD" })
      .then((res) => !cancelled && setAvailability(res.ok ? "model" : "none"))
      .catch(() => !cancelled && setAvailability("none"));
    return () => {
      cancelled = true;
    };
  }, [url]);

  // Fallback when there's no 3D model: the teacher's sprite if one exists, else the emoji
  const emoji = boss.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`battle-monster battle-sprite ${dodging ? "dodging" : ""}`}
      src={boss.image}
      alt={boss.name}
      draggable={false}
    />
  ) : (
    <div className={`battle-monster ${dodging ? "dodging" : ""}`}>{boss.emoji}</div>
  );

  if (availability !== "model") return emoji;

  return (
    <ModelErrorBoundary fallback={emoji}>
      <div className={`battle-model ${dodging ? "dodging" : ""}`} aria-label={boss.name}>
        <Canvas camera={{ position: [0, 0.3, 4.2], fov: 40 }} gl={{ alpha: true }} dpr={[1, 2]}>
          <ambientLight intensity={1.1} />
          <directionalLight position={[2, 4, 3]} intensity={1.6} />
          <directionalLight position={[-3, 1, -2]} intensity={0.5} />
          <Suspense fallback={null}>
            <Model url={url} dodging={dodging} />
          </Suspense>
        </Canvas>
      </div>
    </ModelErrorBoundary>
  );
}
