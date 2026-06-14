"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Html, OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import { useNeuralOpsStore } from "@/store/neural-ops";

const NETWORK_AGENTS = [
  { id: "sm", short: "SEC-MON", color: "#22d3ee", ring: 0, angle: 0 },
  { id: "ti", short: "THR-INT", color: "#38bdf8", ring: 0, angle: 1.4 },
  { id: "si", short: "SOC-INT", color: "#06b6d4", ring: 0, angle: 2.8 },
  { id: "ic", short: "CMD", color: "#a78bfa", ring: 1, angle: 0.2, commander: true },
  { id: "df", short: "FORENS", color: "#8b5cf6", ring: 1, angle: 0.9 },
  { id: "ca", short: "COMMS", color: "#c084fc", ring: 1, angle: 1.6 },
  { id: "ff", short: "FIN", color: "#818cf8", ring: 1, angle: 2.3 },
  { id: "ii", short: "IDENT", color: "#6366f1", ring: 1, angle: 3.0 },
  { id: "tr", short: "TIME", color: "#7c3aed", ring: 1, angle: 3.7 },
  { id: "co", short: "CORR", color: "#34d399", ring: 1, angle: 4.4 },
  { id: "rc", short: "ROOT", color: "#10b981", ring: 2, angle: 0.5 },
  { id: "ia", short: "IMPACT", color: "#2dd4bf", ring: 2, angle: 1.5 },
  { id: "rs", short: "RISK", color: "#059669", ring: 2, angle: 2.5 },
  { id: "cp", short: "COMPLY", color: "#f87171", ring: 2, angle: 3.5 },
  { id: "lg", short: "LEGAL", color: "#ef4444", ring: 2, angle: 4.5 },
  { id: "au", short: "AUDIT", color: "#fb7185", ring: 2, angle: 5.5 },
  { id: "es", short: "EXEC", color: "#fbbf24", ring: 2, angle: 0 },
];

const RING_RADIUS = [2.2, 3.1, 4.0];
const DEFAULT_ACTIVE = new Set(["ic", "df", "ff", "ca", "ii", "co", "rs", "cp", "lg", "au", "es", "sm"]);

function ringPosition(ring: number, angle: number): THREE.Vector3 {
  const r = RING_RADIUS[ring] ?? 2.5;
  return new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r);
}

function NeuralCore() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.12;
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.5, 14, 14]} />
        <meshStandardMaterial color="#0e7490" emissive="#22d3ee" emissiveIntensity={0.75} wireframe />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.36, 10, 10]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.55} transparent opacity={0.9} />
      </mesh>
      <Html center distanceFactor={8} position={[0, 0.85, 0]}>
        <div className="pointer-events-none whitespace-nowrap rounded border border-cyan-500/30 bg-[#020617]/90 px-2 py-0.5 font-mono text-[10px] font-medium text-cyan-300">
          Neural OPS Core
        </div>
      </Html>
    </group>
  );
}

function RecruitmentPulse({ target, color }: { target: THREE.Vector3; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * 0.35) % 1;
    ref.current.position.lerpVectors(new THREE.Vector3(0, 0, 0), target, t);
    ref.current.scale.setScalar(1 - t * 0.5);
  });
  return (
      <mesh ref={ref}>
      <sphereGeometry args={[0.06, 6, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
}

function AgentNode({
  agent,
  active,
  selected,
  onSelect,
}: {
  agent: (typeof NETWORK_AGENTS)[0];
  active: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const base = ringPosition(agent.ring, agent.angle);
  const size = agent.commander ? 0.16 : 0.12;

  return (
    <group position={base}>
      <mesh
        onClick={() => onSelect(agent.id)}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "auto"; }}
      >
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial
          color={agent.color}
          emissive={agent.color}
          emissiveIntensity={active ? (selected ? 1 : 0.6) : 0.12}
          transparent
          opacity={active ? 1 : 0.35}
        />
      </mesh>
      <Html center distanceFactor={10} position={[0, -0.35, 0]}>
        <div
          className={`pointer-events-none whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[9px] ${
            active ? "font-medium text-slate-200" : "text-slate-600"
          }`}
        >
          {agent.short}
        </div>
      </Html>
      {active && (
        <Line
          points={[new THREE.Vector3(0, 0, 0), base]}
          color="#22d3ee"
          lineWidth={0.6}
          transparent
          opacity={0.22}
        />
      )}
    </group>
  );
}

function RingGuide({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, -0.02, Math.sin(a) * radius));
    }
    return pts;
  }, [radius]);
  return <Line points={points} color="#22d3ee" lineWidth={0.5} transparent opacity={0.1} />;
}

export function AgentNetworkScene() {
  const [selectedId, setSelectedId] = useState("ic");
  const recruitedIds = useNeuralOpsStore((s) => s.recruitedAgentIds);

  const activeSet = useMemo(() => {
    const set = new Set(DEFAULT_ACTIVE);
    recruitedIds.forEach((id) => set.add(id));
    return set;
  }, [recruitedIds]);

  const recruitedAgents = NETWORK_AGENTS.filter((a) => recruitedIds.includes(a.id) && !DEFAULT_ACTIVE.has(a.id));

  return (
    <>
      <ambientLight intensity={0.32} />
      <pointLight position={[5, 7, 5]} intensity={0.65} color="#22d3ee" />
      <pointLight position={[-4, 4, -3]} intensity={0.3} color="#64748b" />

      <OrbitControls
        enableZoom
        enablePan={false}
        enableRotate
        minDistance={5}
        maxDistance={16}
        autoRotate={false}
      />

      <Grid
        position={[0, -1.6, 0]}
        args={[20, 20]}
        cellSize={0.7}
        cellThickness={0.35}
        cellColor="#0e7490"
        sectionSize={3.5}
        sectionThickness={0.5}
        sectionColor="#22d3ee"
        fadeDistance={22}
        infiniteGrid
      />

      <NeuralCore />

      {RING_RADIUS.map((r) => (
        <RingGuide key={r} radius={r} />
      ))}

      {NETWORK_AGENTS.map((agent) => (
        <AgentNode
          key={agent.id}
          agent={agent}
          active={activeSet.has(agent.id)}
          selected={selectedId === agent.id}
          onSelect={setSelectedId}
        />
      ))}

      {recruitedAgents.length > 0 &&
        recruitedAgents.map((agent) => (
          <RecruitmentPulse key={`pulse-${agent.id}`} target={ringPosition(agent.ring, agent.angle)} color={agent.color} />
        ))}
    </>
  );
}
