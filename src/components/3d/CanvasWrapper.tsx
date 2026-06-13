"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const Canvas = dynamic(() => import("@react-three/fiber").then((m) => m.Canvas), { ssr: false });

interface CanvasWrapperProps {
  children: React.ReactNode;
  className?: string;
  camera?: { position: [number, number, number]; fov?: number };
}

export function CanvasWrapper({ children, className, camera = { position: [0, 0, 8], fov: 50 } }: CanvasWrapperProps) {
  return (
    <div className={className}>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-neural-bg">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
          </div>
        }
      >
        <Canvas camera={camera} gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
          <color attach="background" args={["#030712"]} />
          <fog attach="fog" args={["#030712", 8, 25]} />
          {children}
        </Canvas>
      </Suspense>
    </div>
  );
}
