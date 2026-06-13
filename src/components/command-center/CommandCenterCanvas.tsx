"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Scanlines } from "@/components/ui/Scanlines";

const Canvas = dynamic(() => import("@react-three/fiber").then((m) => m.Canvas), { ssr: false });

interface CommandCenterCanvasProps {
  children: React.ReactNode;
  className?: string;
}

export function CommandCenterCanvas({ children, className }: CommandCenterCanvasProps) {
  return (
    <div className={`glass-premium relative ${className ?? ""}`}>
      <Scanlines className="z-[5] opacity-40" />
      <div className="terminal-noise pointer-events-none absolute inset-0 z-[4]" aria-hidden />
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-[#020617]">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 3.5, 11], fov: 52 }}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          dpr={[1, 2]}
          className="!h-full !w-full"
        >
          <color attach="background" args={["#020617"]} />
          <fog attach="fog" args={["#020617", 18, 42]} />
          {children}
        </Canvas>
      </Suspense>
    </div>
  );
}
