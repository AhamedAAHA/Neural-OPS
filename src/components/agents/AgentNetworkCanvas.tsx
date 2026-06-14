"use client";

import dynamic from "next/dynamic";
import { Suspense, useMemo, useState } from "react";

const Canvas = dynamic(() => import("@react-three/fiber").then((m) => m.Canvas), { ssr: false });

interface AgentNetworkCanvasProps {
  children: React.ReactNode;
  className?: string;
}

function canUseWebgl() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export function AgentNetworkCanvas({ children, className }: AgentNetworkCanvasProps) {
  const [contextLost, setContextLost] = useState(false);
  const webglReady = useMemo(() => canUseWebgl(), []);

  if (!webglReady || contextLost) {
    return (
      <div className={`relative overflow-hidden bg-[#020617] ${className ?? ""}`}>
        <div className="flex h-full w-full items-center justify-center p-4 text-center">
          <div>
            <div className="font-mono text-xs text-cyan-300">2D topology fallback</div>
            <div className="mt-1 font-mono text-[10px] text-slate-500">WebGL context unavailable. Showing lightweight mode.</div>
          </div>
        </div>
      </div>
    );
  }

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
          gl={{ antialias: false, alpha: false }}
          dpr={[1, 1.2]}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener(
              "webglcontextlost",
              (event) => {
                event.preventDefault();
                setContextLost(true);
              },
              { once: true }
            );
          }}
          className="!h-full !w-full"
        >
          <color attach="background" args={["#020617"]} />
          {children}
        </Canvas>
      </Suspense>
    </div>
  );
}
