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
  { id: "vendor", label: "Primary Vendor", status: "compromised", position: [-3.2, 0, -1.2] },
  { id: "payment", label: "Payment System", status: "compromised", position: [-1.4, 0, 2.8] },
  { id: "cloud", label: "Cloud Platform", status: "suspicious", position: [-3.8, 0, 1.8] },
  { id: "db", label: "Cloud Database", status: "suspicious", position: [2.6, 0, 2.2] },
  { id: "finance", label: "Finance Server", status: "suspicious", position: [3.4, 0, -0.8] },
  { id: "device", label: "Employee Device", status: "suspicious", position: [1.2, 0, -3.2] },
  { id: "gateway", label: "API Gateway", status: "safe", position: [3.8, 0, 2.8] },
  { id: "firewall", label: "Firewall", status: "safe", position: [-2.4, 0, 2.4] },
  { id: "siem", label: "SIEM", status: "safe", position: [0.2, 0, -3.6] },
];

const STATIC_LINKS: [string, string][] = [
  ["core", "firewall"],
  ["core", "siem"],
  ["core", "gateway"],
  ["firewall", "vendor"],
  ["firewall", "payment"],
  ["cloud", "db"],
  ["payment", "db"],
  ["vendor", "payment"],
  ["db", "finance"],
  ["finance", "device"],
  ["gateway", "cloud"],
  ["siem", "device"],
];

const STATUS_COLOR: Record<NodeStatus, string> = {
  safe: "#22d3ee",
  compromised: "#ef4444",
  suspicious: "#f59e0b",
  agent: "#a78bfa",
};

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
      <sphereGeometry args={[0.05, 6, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.85} />
    </mesh>
  );
}

function TwinNodeMesh({ node, hovered, onHover, onSelect }: { node: TwinNode; hovered: boolean; onHover: (id: string | null) => void; onSelect?: (id: string) => void }) {
  const color = STATUS_COLOR[node.status];
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.elapsedTime + node.position[0] * 0.35 + node.position[2] * 0.2;
      groupRef.current.position.y = node.position[1] + Math.sin(t * 1.35) * 0.035;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01;
    }
    if (auraRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 2.8 + node.position[0]) * 0.08;
      auraRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef} position={node.position}>
      <mesh ref={auraRef}>
        <sphereGeometry args={[0.21, 10, 10]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.26 : 0.16} />
      </mesh>
      <mesh onPointerOver={() => onHover(node.id)} onPointerOut={() => onHover(null)} onClick={() => onSelect?.(node.id)}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 0.75 : 0.35} />
      </mesh>
      {node.status !== "safe" && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.16, 0]}>
          <torusGeometry args={[0.22, 0.015, 6, 28]} />
          <meshBasicMaterial color={color} transparent opacity={0.55} />
        </mesh>
      )}
      <Text position={[0, -0.32, 0]} fontSize={0.08} color="#cbd5e1" anchorX="center" outlineWidth={0.01} outlineColor="#020617">
        {node.label}
      </Text>
    </group>
  );
}

function CorePulse() {
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const ta = (clock.elapsedTime * 0.7) % 1;
    const tb = ((clock.elapsedTime * 0.7) + 0.5) % 1;
    if (ringARef.current) {
      ringARef.current.scale.setScalar(1 + ta * 1.8);
      const mat = ringARef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.32 * (1 - ta);
    }
    if (ringBRef.current) {
      ringBRef.current.scale.setScalar(1 + tb * 1.8);
      const mat = ringBRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.24 * (1 - tb);
    }
  });

  return (
    <>
      <mesh ref={ringARef} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[0.34, 0.38, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.2} />
      </mesh>
      <mesh ref={ringBRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[0.34, 0.38, 48]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.15} />
      </mesh>
    </>
  );
}

export function EnterpriseNetworkTwinScene({ onNodeSelect }: { onNodeSelect?: (id: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredNode = TWIN_NODES.find((n) => n.id === hovered);
  const threatChain = useMemo(() => [pos("vendor"), pos("payment"), pos("db"), pos("finance")], []);
  const defenseChain = useMemo(() => [pos("core"), pos("firewall"), pos("siem")], []);
  const dynamicLinkColor = useMemo(() => {
    const byId = new Map(TWIN_NODES.map((node) => [node.id, node]));
    return (from: string, to: string) => {
      const a = byId.get(from);
      const b = byId.get(to);
      if (!a || !b) return "#22d3ee";
      if (a.status === "compromised" || b.status === "compromised") return "#ef4444";
      if (a.status === "suspicious" || b.status === "suspicious") return "#f59e0b";
      return "#22d3ee";
    };
  }, []);
  const liveFlows = useMemo(
    () =>
      STATIC_LINKS.map(([from, to], index) => ({
        from: pos(from),
        to: pos(to),
        color: dynamicLinkColor(from, to),
        speed: 0.14 + (index % 5) * 0.03,
        offset: (index % 7) / 7,
      })),
    [dynamicLinkColor]
  );

  return (
    <>
      <ambientLight intensity={0.28} />
      <pointLight position={[4, 6, 4]} intensity={0.45} color="#22d3ee" />
      <directionalLight position={[2, 8, 2]} intensity={0.25} color="#64748b" />

      <OrbitControls
        makeDefault
        enableZoom
        zoomSpeed={1.15}
        enablePan={false}
        enableRotate
        rotateSpeed={0.55}
        enableDamping
        dampingFactor={0.08}
        minDistance={2.8}
        maxDistance={22}
        minPolarAngle={0.55}
        maxPolarAngle={1.45}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
        autoRotate={false}
      />

      <Grid position={[0, -1.8, 0]} args={[14, 14]} cellSize={1} cellThickness={0.3} cellColor="#0e7490" sectionSize={4} sectionThickness={0.45} sectionColor="#22d3ee" fadeDistance={18} infiniteGrid />

      <mesh>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#0e7490" emissive="#22d3ee" emissiveIntensity={0.45} />
      </mesh>
      <CorePulse />
      <Text position={[0, -0.45, 0]} fontSize={0.08} color="#22d3ee" anchorX="center" outlineWidth={0.01} outlineColor="#020617">
        Neural OPS Core
      </Text>

      {STATIC_LINKS.map(([a, b], index) => (
        <Line key={`${a}-${b}`} points={[pos(a), pos(b)]} color={dynamicLinkColor(a, b)} lineWidth={0.5} transparent opacity={0.1 + (index % 4) * 0.03} />
      ))}

      {TWIN_NODES.filter((node) => node.id !== "core").map((node) => (
        <TwinNodeMesh key={node.id} node={node} hovered={hovered === node.id} onHover={setHovered} onSelect={onNodeSelect} />
      ))}

      <TravelingPulse from={threatChain[0]} to={threatChain[1]} color="#ef4444" />
      <TravelingPulse from={threatChain[2]} to={threatChain[3]} color="#ef4444" offset={0.25} />
      <TravelingPulse from={defenseChain[1]} to={defenseChain[2]} color="#22d3ee" speed={0.18} offset={0.5} />
      {liveFlows.map((flow, index) => (
        <TravelingPulse key={`live-flow-${index}`} from={flow.from} to={flow.to} color={flow.color} speed={flow.speed} offset={flow.offset} />
      ))}

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
