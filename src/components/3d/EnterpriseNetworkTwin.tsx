"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Text, Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { NETWORK_NODES } from "@/lib/mock-data";

const TYPE_COLORS: Record<string, string> = {
  database: "#a78bfa",
  cloud: "#38bdf8",
  device: "#fbbf24",
  vendor: "#f87171",
  gateway: "#fb923c",
  portal: "#34d399",
  server: "#818cf8",
  identity: "#22d3ee",
};

function ThreatPulseLine({ from, to, active }: { from: THREE.Vector3; to: THREE.Vector3; active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current || !active) return;
    const t = (clock.elapsedTime * 0.5) % 1;
    ref.current.position.lerpVectors(from, to, t);
  });

  if (!active) return null;

  return (
    <mesh ref={ref} position={from.toArray()}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshBasicMaterial color="#f87171" />
    </mesh>
  );
}

function NetworkNodeMesh({
  node,
  onHover,
}: {
  node: (typeof NETWORK_NODES)[0];
  onHover: (id: string | null) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const color = TYPE_COLORS[node.type] ?? "#94a3b8";
  const isThreat = node.threatLevel > 0.6;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = node.position[1] + Math.sin(clock.elapsedTime + node.position[0]) * 0.08;
    if (isThreat) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 3) * 0.15 * node.threatLevel;
      ref.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={node.position}>
      <mesh
        ref={ref}
        onPointerOver={() => onHover(node.id)}
        onPointerOut={() => onHover(null)}
      >
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={isThreat ? "#f87171" : color}
          emissiveIntensity={isThreat ? node.threatLevel * 0.8 : 0.4}
        />
      </mesh>

      {node.activeAgent && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.015, 8, 24]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.6} />
        </mesh>
      )}

      {isThreat && (
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#f87171" transparent opacity={0.08 + Math.sin(Date.now() * 0.003) * 0.04} />
        </mesh>
      )}

      <Text position={[0, -0.55, 0]} fontSize={0.1} color="#94a3b8" anchorX="center">
        {node.label}
      </Text>
    </group>
  );
}

function ConnectionLines() {
  const connections = useMemo(() => {
    const pairs: [number, number][] = [
      [0, 4], [4, 3], [3, 7], [7, 2], [2, 8], [8, 0], [1, 6], [6, 5],
    ];
    return pairs.map(([a, b]) => ({
      from: new THREE.Vector3(...NETWORK_NODES[a].position),
      to: new THREE.Vector3(...NETWORK_NODES[b].position),
      threat: NETWORK_NODES[a].threatLevel > 0.6 || NETWORK_NODES[b].threatLevel > 0.6,
    }));
  }, []);

  return (
    <>
      {connections.map((c, i) => {
        const points = [c.from, c.to];
        return (
          <Line
            key={i}
            points={points}
            color={c.threat ? "#f87171" : "#22d3ee"}
            lineWidth={0.5}
            transparent
            opacity={c.threat ? 0.5 : 0.2}
          />
        );
      })}
    </>
  );
}

export function EnterpriseNetworkTwinScene() {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredNode = NETWORK_NODES.find((n) => n.id === hovered);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.08;
  });

  const threatPairs = useMemo(
    () => [
      { from: new THREE.Vector3(...NETWORK_NODES[3].position), to: new THREE.Vector3(...NETWORK_NODES[4].position) },
      { from: new THREE.Vector3(...NETWORK_NODES[7].position), to: new THREE.Vector3(...NETWORK_NODES[2].position) },
    ],
    []
  );

  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[5, 5, 5]} intensity={0.6} color="#22d3ee" />
      <pointLight position={[-5, 3, -5]} intensity={0.3} color="#a78bfa" />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 4} />

      <group ref={groupRef}>
        <ConnectionLines />
        {NETWORK_NODES.map((node) => (
          <NetworkNodeMesh key={node.id} node={node} onHover={setHovered} />
        ))}
        {threatPairs.map((pair, i) => (
          <ThreatPulseLine key={i} from={pair.from} to={pair.to} active />
        ))}
      </group>

      {hoveredNode && (
        <Html position={hoveredNode.position} center distanceFactor={8}>
          <div className="glass rounded-lg border border-cyan-500/30 p-3 text-xs whitespace-nowrap pointer-events-none">
            <div className="font-semibold text-white">{hoveredNode.label}</div>
            <div className="text-slate-400">Threat: {(hoveredNode.threatLevel * 100).toFixed(0)}%</div>
            {hoveredNode.activeAgent && (
              <div className="text-cyan-400">Agent: {hoveredNode.activeAgent}</div>
            )}
          </div>
        </Html>
      )}
    </>
  );
}
