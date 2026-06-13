"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const Canvas = dynamic(() => import("@react-three/fiber").then((m) => m.Canvas), { ssr: false });

interface AgentNetworkCanvasProps {
  children: React.ReactNode;
  className?: string;
}

export function AgentNetworkCanvas({ children, className }: AgentNetworkCanvasProps) {
  return (
    <div className={`relative overflow-hidden bg-[#020617] ${className ?? ""}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-[#020617]">
            <div className="font-mono text-[10px] text-cyan-500/60">[ LOADING TOPOLOGY ]</div>
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 4.5, 6.5], fov: 48 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 1.5]}
          className="!h-full !w-full"
        >
          <color attach="background" args={["#020617"]} />
          {children}
        </Canvas>
      </Suspense>
    </div>
  );
}
