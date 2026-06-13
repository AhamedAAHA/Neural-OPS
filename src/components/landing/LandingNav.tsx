"use client";

import Link from "next/link";
import { Radio } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { NeonButton } from "@/components/ui/NeonButton";

export function LandingNav() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-neural-bg/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-cyan-400" />
          <span className="font-bold tracking-wide text-white">{APP_NAME}</span>
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/command-center" className="text-sm text-slate-400 transition hover:text-white">
            Command Center
          </Link>
          <Link href="/investigation" className="text-sm text-slate-400 transition hover:text-white">
            Investigation
          </Link>
          <Link href="/evidence" className="text-sm text-slate-400 transition hover:text-white">
            Evidence
          </Link>
          <Link href="/agents" className="text-sm text-slate-400 transition hover:text-white">
            Agents
          </Link>
        </div>
        <NeonButton href="/command-center" size="sm">
          Launch Command Center
        </NeonButton>
      </div>
    </nav>
  );
}
