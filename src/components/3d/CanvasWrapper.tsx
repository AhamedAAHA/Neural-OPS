"use client";

import dynamic from "next/dynamic";
import { Suspense, useMemo } from "react";

const Canvas = dynamic(() => import("@react-three/fiber").then((m) => m.Canvas), { ssr: false });

interface CanvasWrapperProps {
  children: React.ReactNode;
  className?: string;
  camera?: { position: [number, number, number]; fov?: number };
  transparent?: boolean;
  interactive?: boolean;
  fallback?: React.ReactNode;
}

function canUseWebgl() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

export function CanvasWrapper({ children, className, camera = { position: [0, 0, 8], fov: 50 }, transparent, interactive = true, fallback }: CanvasWrapperProps) {
  const webglReady = useMemo(() => canUseWebgl(), []);

  if (!webglReady) {
    return (
      <div className={className}>
        {fallback ?? (
          <div className={`flex h-full w-full items-center justify-center ${transparent ? "bg-transparent" : "bg-neural-bg"}`}>
            <div className="h-28 w-28 rounded-full border border-cyan-400/40 bg-[radial-gradient(circle_at_35%_35%,rgba(34,211,238,0.35),rgba(2,6,23,0.15)_55%)] shadow-[0_0_60px_rgba(34,211,238,0.25)]" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${className ?? ""} ${interactive ? "" : "pointer-events-none"}`.trim()}>
      <Suspense
        fallback={
          <div className={`flex h-full w-full items-center justify-center ${transparent ? "bg-transparent" : "bg-neural-bg"}`}>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
          </div>
        }
      >
        <Canvas camera={camera} gl={{ antialias: true, alpha: transparent ?? false }} dpr={[1, 2]} className="!h-full !w-full">
          {!transparent && <color attach="background" args={["#020617"]} />}
          {!transparent && <fog attach="fog" args={["#020617", 8, 25]} />}
          {children}
        </Canvas>
      </Suspense>
    </div>
  );
}
