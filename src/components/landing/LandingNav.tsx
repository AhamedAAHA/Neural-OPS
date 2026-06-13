"use client";

import Link from "next/link";
import { Radio } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { NeonButton } from "@/components/ui/NeonButton";

export function LandingNav() {
  return (
    <nav className="glass-premium fixed left-0 right-0 top-0 z-50 border-b border-cyan-500/15">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-cyan-400" />
          <span className="font-display text-sm font-bold tracking-wider text-white">{APP_NAME}</span>
        </Link>
        <div className="hidden items-center gap-5 md:flex">
          {[
            { href: "/command-center", label: "Command Center" },
            { href: "/investigation", label: "Investigation" },
            { href: "/voice", label: "Voice" },
            { href: "/evidence", label: "Evidence" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="font-mono text-[11px] uppercase tracking-wider text-slate-500 transition hover:text-cyan-400">
              {link.label}
            </Link>
          ))}
        </div>
        <NeonButton href="/command-center" size="sm" className="font-mono text-[10px] uppercase">
          &gt; Launch SOC
        </NeonButton>
      </div>
    </nav>
  );
}
