"use client";

import dynamic from "next/dynamic";
import { Suspense, useMemo, useState } from "react";
import { Scanlines } from "@/components/ui/Scanlines";

const Canvas = dynamic(() => import("@react-three/fiber").then((m) => m.Canvas), { ssr: false });

interface CommandCenterCanvasProps {
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

export function CommandCenterCanvas({ children, className }: CommandCenterCanvasProps) {
  const [contextLost, setContextLost] = useState(false);
  const webglReady = useMemo(() => canUseWebgl(), []);

  if (!webglReady || contextLost) {
    return (
      <div className={`glass-premium relative ${className ?? ""}`}>
        <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(34,211,238,0.2),rgba(2,6,23,1)_70%)] p-4 text-center">
          <div className="mb-2 font-mono text-xs text-cyan-300">3D view unavailable</div>
          <div className="max-w-[240px] font-mono text-[10px] text-slate-400">
            Falling back to 2D telemetry mode due to unavailable or lost WebGL context.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-premium relative ${className ?? ""}`}>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_25%_20%,rgba(34,211,238,0.14),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.1),transparent_40%)]" />
      <Scanlines className="z-[2] opacity-20" />
      <div className="terminal-noise pointer-events-none absolute inset-0 z-[2]" aria-hidden />
      <Suspense
        fallback={
          <div className="relative z-[3] flex h-full w-full items-center justify-center bg-[#020617]/70">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 3.5, 11], fov: 52 }}
          gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
          dpr={[1, 1.25]}
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
          className="!relative !z-[3] !h-full !w-full"
        >
          <color attach="background" args={["#020617"]} />
          <fog attach="fog" args={["#020617", 18, 42]} />
          {children}
        </Canvas>
      </Suspense>
    </div>
  );
}
