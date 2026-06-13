"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Line, Text, Float } from "@react-three/drei";
import * as THREE from "three";

function GlobeWireframe() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2.2, 32, 32]} />
      <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.15} />
    </mesh>
  );
}

function ThreatPulse({ position, delay }: { position: [number, number, number]; delay: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime + delay) % 3;
    const scale = 0.3 + t * 0.5;
    ref.current.scale.setScalar(scale);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 1 - t / 3;
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshBasicMaterial color="#f87171" transparent opacity={0.8} />
    </mesh>
  );
}

function AttackArc({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const points = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = s.clone().add(e).multiplyScalar(0.5);
    mid.y += 1.5;
    const curve = new THREE.QuadraticBezierCurve3(s, mid, e);
    return curve.getPoints(20);
  }, [start, end]);

  return <Line points={points} color="#f87171" lineWidth={1} transparent opacity={0.6} />;
}

function ServerNode({ position, color, label }: { position: [number, number, number]; color: string; label: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(clock.elapsedTime + position[0]) * 0.1;
  });

  return (
    <group position={position}>
      <Float speed={2} floatIntensity={0.3}>
        <mesh ref={ref}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
      </Float>
      <Text position={[0, -0.35, 0]} fontSize={0.08} color="#94a3b8" anchorX="center">
        {label}
      </Text>
    </group>
  );
}

function NeuralCore() {
  const ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.5;
      const pulse = 1 + Math.sin(clock.elapsedTime * 2) * 0.1;
      ref.current.scale.setScalar(pulse);
    }
    if (ringRef.current) ringRef.current.rotation.z = clock.elapsedTime * 0.3;
  });

  return (
    <group>
      <Sphere ref={ref} args={[0.4, 16, 16]}>
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.2} transparent opacity={0.9} />
      </Sphere>
      <mesh ref={ringRef}>
        <torusGeometry args={[0.7, 0.02, 8, 32]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.5} />
      </mesh>
      <Text position={[0, -0.8, 0]} fontSize={0.12} color="#22d3ee" anchorX="center">
        NEURAL OPS
      </Text>
    </group>
  );
}

function AgentOrbit({ radius, speed, color, angleOffset }: { radius: number; speed: number; color: string; angleOffset: number }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const a = clock.elapsedTime * speed + angleOffset;
    ref.current.position.set(Math.cos(a) * radius, Math.sin(a * 0.5) * 0.3, Math.sin(a) * radius);
  });

  return (
    <group ref={ref}>
      <Sphere args={[0.12, 8, 8]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </Sphere>
    </group>
  );
}

function BandMessagePanel({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Float speed={1.5} floatIntensity={0.2}>
      <group position={position}>
        <mesh>
          <planeGeometry args={[1.8, 0.4]} />
          <meshBasicMaterial color="#0a0f1e" transparent opacity={0.85} />
        </mesh>
        <Text position={[0, 0, 0.01]} fontSize={0.06} color="#22d3ee" maxWidth={1.6} anchorX="center" anchorY="middle">
          {text}
        </Text>
      </group>
    </Float>
  );
}

export function ThreatGlobeScene() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.05;
  });

  const threatPoints: [number, number, number][] = [
    [1.8, 0.5, 1.2],
    [-1.5, -0.3, 1.8],
    [0.8, 1.2, -1.6],
    [-2, 0.8, -0.5],
  ];

  const agentColors = ["#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#818cf8", "#f87171", "#fb923c", "#e879f9"];

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#22d3ee" />
      <pointLight position={[-10, -5, -10]} intensity={0.4} color="#a78bfa" />

      <group ref={groupRef}>
        <GlobeWireframe />
        <NeuralCore />

        {agentColors.map((color, i) => (
          <AgentOrbit key={color} radius={3.2} speed={0.3 + i * 0.05} color={color} angleOffset={(i / agentColors.length) * Math.PI * 2} />
        ))}

        {threatPoints.map((pos, i) => (
          <ThreatPulse key={i} position={pos} delay={i * 0.7} />
        ))}

        <AttackArc start={[1.8, 0.5, 1.2]} end={[-1.5, -0.3, 1.8]} />
        <AttackArc start={[0.8, 1.2, -1.6]} end={[1.8, 0.5, 1.2]} />

        <ServerNode position={[3.5, 0, 0]} color="#34d399" label="Agent" />
        <ServerNode position={[-3.5, 0.5, 1]} color="#22d3ee" label="Server" />
        <ServerNode position={[0, -3, 1.5]} color="#f87171" label="Threat" />
        <ServerNode position={[2, 2.5, -2]} color="#a78bfa" label="Forensics" />

        <BandMessagePanel position={[2.5, 1.5, 0]} text="Commander recruited Digital Forensics Agent" />
        <BandMessagePanel position={[-2.5, 1, 1]} text="Compliance requested Legal review" />
        <BandMessagePanel position={[0, 2.8, -1]} text="Risk calculated 87/100 severity" />
        <BandMessagePanel position={[-1.8, -1.5, 2]} text="Legal → Human: Approval required" />
        <BandMessagePanel position={[1.5, -2, -1.5]} text="Forensics → Compliance: Evidence shared" />
      </group>
    </>
  );
}
