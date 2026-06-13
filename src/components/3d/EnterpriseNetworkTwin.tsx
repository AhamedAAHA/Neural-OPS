"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Text, Html, Grid, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type NodeStatus = "safe" | "compromised" | "suspicious" | "agent";

interface TwinNode {
  id: string;
  label: string;
  status: NodeStatus;
  position: [number, number, number];
}

const TWIN_NODES: TwinNode[] = [
  { id: "core", label: "Neural OPS Core", status: "agent", position: [0, 0, 0] },
  { id: "vendor", label: "Vendor System", status: "compromised", position: [-3.2, 0, -1.2] },
  { id: "payment", label: "Payment Gateway", status: "compromised", position: [-1.4, 0, 2.8] },
  { id: "db", label: "Cloud Database", status: "suspicious", position: [2.6, 0, 2.2] },
  { id: "finance", label: "Finance Server", status: "suspicious", position: [3.4, 0, -0.8] },
  { id: "device", label: "Employee Device", status: "suspicious", position: [1.2, 0, -3.2] },
  { id: "firewall", label: "Firewall", status: "safe", position: [-2.4, 0, 2.4] },
  { id: "siem", label: "SIEM", status: "safe", position: [0.2, 0, -3.6] },
];

const STATUS_COLOR: Record<NodeStatus, string> = {
  safe: "#22d3ee",
  compromised: "#ef4444",
  suspicious: "#f59e0b",
  agent: "#a78bfa",
};

const STATIC_LINKS: [string, string][] = [
  ["core", "firewall"],
  ["core", "siem"],
  ["firewall", "vendor"],
  ["firewall", "payment"],
  ["payment", "db"],
  ["vendor", "payment"],
  ["db", "finance"],
  ["finance", "device"],
  ["siem", "device"],
];

function pos(id: string) {
  return new THREE.Vector3(...TWIN_NODES.find((n) => n.id === id)!.position);
}

function TravelingPulse({ from, to, color, speed = 0.22, offset = 0 }: { from: THREE.Vector3; to: THREE.Vector3; color: string; speed?: number; offset?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.lerpVectors(from, to, ((clock.elapsedTime * speed + offset) % 1));
  });
  return (
    <mesh ref={ref} position={from.toArray()}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.85} />
    </mesh>
  );
}

function TwinNodeMesh({ node, hovered, onHover, onSelect }: { node: TwinNode; hovered: boolean; onHover: (id: string | null) => void; onSelect?: (id: string) => void }) {
  if (node.id === "core") return null;
  const color = STATUS_COLOR[node.status];
  return (
    <group position={node.position}>
      <mesh onPointerOver={() => onHover(node.id)} onPointerOut={() => onHover(null)} onClick={() => onSelect?.(node.id)}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 0.55 : 0.3} />
      </mesh>
      <Text position={[0, -0.32, 0]} fontSize={0.08} color="#cbd5e1" anchorX="center" outlineWidth={0.01} outlineColor="#020617">
        {node.label}
      </Text>
    </group>
  );
}

export function EnterpriseNetworkTwinScene({ onNodeSelect }: { onNodeSelect?: (id: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredNode = TWIN_NODES.find((n) => n.id === hovered);
  const threatChain = useMemo(() => [pos("vendor"), pos("payment"), pos("db")], []);
  const defenseChain = useMemo(() => [pos("core"), pos("firewall"), pos("siem")], []);

  return (
    <>
      <ambientLight intensity={0.28} />
      <pointLight position={[4, 6, 4]} intensity={0.45} color="#22d3ee" />
      <directionalLight position={[2, 8, 2]} intensity={0.25} color="#64748b" />

      <OrbitControls
        enableZoom
        enablePan={false}
        enableRotate
        minDistance={4}
        maxDistance={14}
        autoRotate
        autoRotateSpeed={0.35}
      />

      <Grid position={[0, -1.8, 0]} args={[18, 18]} cellSize={0.8} cellThickness={0.4} cellColor="#0e7490" sectionSize={3.2} sectionThickness={0.6} sectionColor="#22d3ee" fadeDistance={20} infiniteGrid />

      <mesh>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial color="#0e7490" emissive="#22d3ee" emissiveIntensity={0.45} />
      </mesh>
      <Text position={[0, -0.45, 0]} fontSize={0.08} color="#22d3ee" anchorX="center" outlineWidth={0.01} outlineColor="#020617">
        Neural OPS Core
      </Text>

      {STATIC_LINKS.map(([a, b]) => (
        <Line key={`${a}-${b}`} points={[pos(a), pos(b)]} color="#22d3ee" lineWidth={0.5} transparent opacity={0.15} />
      ))}

      {TWIN_NODES.map((node) => (
        <TwinNodeMesh key={node.id} node={node} hovered={hovered === node.id} onHover={setHovered} onSelect={onNodeSelect} />
      ))}

      <TravelingPulse from={threatChain[0]} to={threatChain[1]} color="#ef4444" />
      <TravelingPulse from={threatChain[1]} to={threatChain[2]} color="#ef4444" offset={0.5} />
      <TravelingPulse from={defenseChain[0]} to={defenseChain[1]} color="#22d3ee" speed={0.18} />
      <TravelingPulse from={defenseChain[1]} to={defenseChain[2]} color="#22d3ee" speed={0.18} offset={0.5} />

      {hoveredNode && hoveredNode.id !== "core" && (
        <Html position={hoveredNode.position} center distanceFactor={10}>
          <div className="pointer-events-none rounded border border-cyan-500/30 bg-[#020617]/95 px-2.5 py-1.5 font-mono text-[10px] whitespace-nowrap">
            <div className="font-medium text-slate-200">{hoveredNode.label}</div>
            <div className="uppercase text-slate-500">{hoveredNode.status}</div>
          </div>
        </Html>
      )}
    </>
  );
}
