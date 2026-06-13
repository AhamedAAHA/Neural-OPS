"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const Canvas = dynamic(() => import("@react-three/fiber").then((m) => m.Canvas), { ssr: false });

interface CanvasWrapperProps {
  children: React.ReactNode;
  className?: string;
  camera?: { position: [number, number, number]; fov?: number };
  transparent?: boolean;
}

export function CanvasWrapper({ children, className, camera = { position: [0, 0, 8], fov: 50 }, transparent }: CanvasWrapperProps) {
  return (
    <div className={className}>
      <Suspense
        fallback={
          <div className={`flex h-full w-full items-center justify-center ${transparent ? "bg-transparent" : "bg-neural-bg"}`}>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
          </div>
        }
      >
        <Canvas camera={camera} gl={{ antialias: true, alpha: transparent ?? false }} dpr={[1, 2]}>
          {!transparent && <color attach="background" args={["#020617"]} />}
          {!transparent && <fog attach="fog" args={["#020617", 8, 25]} />}
          {children}
        </Canvas>
      </Suspense>
    </div>
  );
}
