"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, Group, InstancedMesh, Matrix4, Object3D, Quaternion, Vector3 } from "three";
import { BOARD, COMPONENTS, PADS, pointAt, TRACES } from "./circuit-geometry";

/**
 * WebGL version of the hero PCB (desktop, fine pointer, motion allowed, WebGL available).
 * Loaded with next/dynamic so three.js never ships to mobile or reduced-motion users.
 * Geometry is the same as CircuitArt, so swapping from the SVG is seamless.
 */

const S = 0.19; // board units → world units
const toWorld = (x: number, y: number, h = 0) => new Vector3((x - BOARD.width / 2) * S, h, (y - BOARD.height / 2) * S);

const COLORS = {
  board: new Color("#173f35"),
  boardEdge: new Color("#0f2e26"),
  trace: new Color("#367a65"),
  pad: new Color("#e2c27e"),
  part: new Color("#0b241d"),
  pin: new Color("#b8c9bf"),
  pulse: new Color("#c8f5d9"),
};

const BOARD_TOP = 0.08;
const PULSING = TRACES.filter((_, i) => i % 2 === 0);

function useInstances(ref: React.RefObject<InstancedMesh | null>, matrices: Matrix4[]) {
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  }, [ref, matrices]);
}

function Traces() {
  const ref = useRef<InstancedMesh>(null);
  const matrices = useMemo(() => {
    const out: Matrix4[] = [];
    for (const t of TRACES) {
      for (let i = 1; i < t.points.length; i++) {
        const a = t.points[i - 1]!;
        const b = t.points[i]!;
        const len = Math.hypot(b.x - a.x, b.y - a.y) * S + 0.03;
        const mid = toWorld((a.x + b.x) / 2, (a.y + b.y) / 2, BOARD_TOP + 0.004);
        const horizontal = a.y === b.y;
        out.push(
          new Matrix4().compose(
            mid,
            new Quaternion(),
            new Vector3(horizontal ? len : 0.032, 0.008, horizontal ? 0.032 : len),
          ),
        );
      }
    }
    return out;
  }, []);
  useInstances(ref, matrices);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, matrices.length]}>
      <boxGeometry />
      <meshStandardMaterial color={COLORS.trace} metalness={0.55} roughness={0.35} emissive={COLORS.trace} emissiveIntensity={0.15} />
    </instancedMesh>
  );
}

function Pads() {
  const ref = useRef<InstancedMesh>(null);
  const matrices = useMemo(
    () => PADS.map((p) => new Matrix4().compose(toWorld(p.x, p.y, BOARD_TOP + 0.006), new Quaternion(), new Vector3(1, 1, 1))),
    [],
  );
  useInstances(ref, matrices);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, matrices.length]}>
      <cylinderGeometry args={[0.065, 0.065, 0.014, 20]} />
      <meshStandardMaterial color={COLORS.pad} metalness={0.35} roughness={0.35} emissive={COLORS.pad} emissiveIntensity={0.25} />
    </instancedMesh>
  );
}

function Parts() {
  const pinsRef = useRef<InstancedMesh>(null);
  const pinMatrices = useMemo(() => {
    const mcu = COMPONENTS.find((c) => c.kind === "mcu")!;
    const out: Matrix4[] = [];
    for (let i = 1; i <= 5; i++) {
      const o = (mcu.w / 6) * i;
      const size = new Vector3(0.05, 0.03, 0.09);
      const sizeRot = new Vector3(0.09, 0.03, 0.05);
      out.push(new Matrix4().compose(toWorld(mcu.x + o, mcu.y - 0.2, BOARD_TOP + 0.02), new Quaternion(), size));
      out.push(new Matrix4().compose(toWorld(mcu.x + o, mcu.y + mcu.h + 0.2, BOARD_TOP + 0.02), new Quaternion(), size));
      out.push(new Matrix4().compose(toWorld(mcu.x - 0.2, mcu.y + o, BOARD_TOP + 0.02), new Quaternion(), sizeRot));
      out.push(new Matrix4().compose(toWorld(mcu.x + mcu.w + 0.2, mcu.y + o, BOARD_TOP + 0.02), new Quaternion(), sizeRot));
    }
    return out;
  }, []);
  useInstances(pinsRef, pinMatrices);

  return (
    <group>
      {COMPONENTS.map((c) => {
        const h = c.kind === "mcu" ? 0.12 : c.kind === "chip" ? 0.08 : c.kind === "header" ? 0.16 : 0.06;
        const pos = toWorld(c.x + c.w / 2, c.y + c.h / 2, BOARD_TOP + h / 2);
        return (
          <mesh key={c.id} position={pos} castShadow>
            <boxGeometry args={[c.w * S, h, c.h * S]} />
            <meshStandardMaterial
              color={c.kind === "crystal" ? COLORS.pin : COLORS.part}
              metalness={c.kind === "crystal" ? 0.85 : 0.2}
              roughness={c.kind === "crystal" ? 0.25 : 0.55}
            />
          </mesh>
        );
      })}
      <instancedMesh ref={pinsRef} args={[undefined, undefined, pinMatrices.length]}>
        <boxGeometry />
        <meshStandardMaterial color={COLORS.pin} metalness={0.9} roughness={0.3} />
      </instancedMesh>
    </group>
  );
}

function Pulses() {
  const core = useRef<InstancedMesh>(null);
  const halo = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const speeds = useMemo(() => PULSING.map((_, i) => 3.4 + (i % 3) * 0.9), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    PULSING.forEach((trace, i) => {
      const cycle = trace.length + 6; // pause between pulses
      const d = (t * speeds[i]! + i * 2.3) % cycle;
      const visible = d <= trace.length;
      const p = pointAt(trace, d);
      dummy.position.copy(toWorld(p.x, p.y, BOARD_TOP + 0.03));
      dummy.scale.setScalar(visible ? 1 : 0);
      dummy.updateMatrix();
      core.current?.setMatrixAt(i, dummy.matrix);
      dummy.scale.setScalar(visible ? 2.6 : 0);
      dummy.updateMatrix();
      halo.current?.setMatrixAt(i, dummy.matrix);
    });
    if (core.current) core.current.instanceMatrix.needsUpdate = true;
    if (halo.current) halo.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={core} args={[undefined, undefined, PULSING.length]}>
        <sphereGeometry args={[0.032, 12, 12]} />
        <meshBasicMaterial color={COLORS.pulse} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={halo} args={[undefined, undefined, PULSING.length]}>
        <sphereGeometry args={[0.032, 12, 12]} />
        <meshBasicMaterial color={COLORS.pulse} transparent opacity={0.22} depthWrite={false} toneMapped={false} />
      </instancedMesh>
    </>
  );
}

function Board() {
  const group = useRef<Group>(null);
  useFrame(({ pointer, clock }, delta) => {
    const g = group.current;
    if (!g) return;
    const ease = 1 - Math.exp(-delta * 3);
    g.rotation.x += (pointer.y * -0.12 - g.rotation.x) * ease;
    g.rotation.z += (pointer.x * -0.1 - g.rotation.z) * ease;
    g.position.y = Math.sin(clock.getElapsedTime() * 0.7) * 0.04;
  });
  return (
    <group ref={group}>
      <group rotation={[0, -0.55, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[BOARD.width * S + 0.08, 0.16, BOARD.height * S + 0.08]} />
          <meshStandardMaterial color={COLORS.board} roughness={0.7} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.03, 0]}>
          <boxGeometry args={[BOARD.width * S + 0.12, 0.08, BOARD.height * S + 0.12]} />
          <meshStandardMaterial color={COLORS.boardEdge} roughness={0.8} />
        </mesh>
        <Traces />
        <Pads />
        <Parts />
        <Pulses />
      </group>
    </group>
  );
}

interface HeroSceneProps {
  active: boolean;
  onReady: () => void;
}

export default function HeroScene({ active, onReady }: HeroSceneProps) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 6.4, 6.3], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ camera }) => {
        camera.lookAt(0, -0.15, 0);
        onReady();
      }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.9} />
      <hemisphereLight args={["#f6f7f4", "#173f35", 0.8]} />
      <directionalLight position={[3, 6, 2.5]} intensity={2} />
      <pointLight position={[-2.5, 1.2, 1.5]} intensity={2.2} distance={8} color="#b8e4c9" />
      <Board />
    </Canvas>
  );
}
