"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Line, Text } from "@react-three/drei";
import * as THREE from "three";

const ORBIT_AGENTS = [
  { name: "Incident", color: "#22d3ee", radius: 2.5, speed: 0.4, offset: 0 },
  { name: "Forensics", color: "#a78bfa", radius: 2.8, speed: 0.35, offset: 0.8 },
  { name: "Legal", color: "#f87171", radius: 3.1, speed: 0.3, offset: 1.6 },
  { name: "Compliance", color: "#34d399", radius: 2.6, speed: 0.38, offset: 2.4 },
  { name: "PR", color: "#fbbf24", radius: 3.3, speed: 0.28, offset: 3.2 },
  { name: "Executive", color: "#e879f9", radius: 2.9, speed: 0.32, offset: 4.0 },
  { name: "Risk", color: "#fb923c", radius: 3.0, speed: 0.33, offset: 4.8 },
  { name: "Audit", color: "#94a3b8", radius: 3.4, speed: 0.25, offset: 5.6 },
];

function OrbitingAgent({ agent, active }: { agent: (typeof ORBIT_AGENTS)[0]; active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const a = clock.elapsedTime * agent.speed + agent.offset;
    ref.current.position.set(
      Math.cos(a) * agent.radius,
      Math.sin(a * 0.7) * 0.4,
      Math.sin(a) * agent.radius
    );
    if (glowRef.current && active) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.2;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={ref}>
      {active && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshBasicMaterial color={agent.color} transparent opacity={0.15} />
        </mesh>
      )}
      <Sphere args={[0.1, 8, 8]}>
        <meshStandardMaterial
          color={agent.color}
          emissive={agent.color}
          emissiveIntensity={active ? 1.2 : 0.3}
        />
      </Sphere>
      <Text position={[0, -0.2, 0]} fontSize={0.07} color={agent.color} anchorX="center">
        {agent.name}
      </Text>
    </group>
  );
}

function CollabLine({ from, to, color }: { from: THREE.Vector3; to: THREE.Vector3; color: string }) {
  return <Line points={[from, to]} color={color} lineWidth={1} transparent opacity={0.4} dashed dashSize={0.1} gapSize={0.05} />;
}

export function AgentOrbitScene({ activeIndices = [0, 1, 2, 3, 6] }: { activeIndices?: number[] }) {
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (coreRef.current) {
      coreRef.current.rotation.y = clock.elapsedTime * 0.4;
      const pulse = 1 + Math.sin(clock.elapsedTime * 2) * 0.08;
      coreRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, 0]} intensity={0.8} color="#22d3ee" />

      <Sphere ref={coreRef} args={[0.35, 16, 16]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.5} />
      </Sphere>

      <Text position={[0, -0.6, 0]} fontSize={0.1} color="#22d3ee" anchorX="center">
        NEURAL OPS CORE
      </Text>

      {ORBIT_AGENTS.map((agent, i) => (
        <OrbitingAgent key={agent.name} agent={agent} active={activeIndices.includes(i)} />
      ))}

      {activeIndices.length >= 2 && (
        <CollabLine
          from={new THREE.Vector3(1.5, 0.2, 1)}
          to={new THREE.Vector3(-1.2, 0.1, 1.8)}
          color="#22d3ee"
        />
      )}
    </>
  );
}
