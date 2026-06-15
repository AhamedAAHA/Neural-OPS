"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Mail, Radio, UserRound, UserPlus } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { NeonButton } from "@/components/ui/NeonButton";

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupClient />
    </Suspense>
  );
}

function SignupFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-premium w-full max-w-md rounded-xl border border-cyan-500/25 p-6">
        <p className="text-center text-sm text-slate-300">Loading registration...</p>
      </div>
    </div>
  );
}

function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || "/command-center", [searchParams]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/session")
      .then((res) => {
        if (!mounted || !res.ok) return;
        router.replace(nextPath);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [router, nextPath]);

  const handleSignup = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }
      router.replace(nextPath);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="glass-premium w-full max-w-md rounded-xl border border-cyan-500/25 p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/10">
            <Radio className="h-5 w-5 text-cyan-300" />
          </div>
          <h1 className="font-display text-lg font-semibold tracking-wide text-white">{APP_NAME}</h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Enterprise Risk &amp; Decision Platform
          </p>
        </div>

        <div className="mb-5">
          <h2 className="font-display text-xl font-semibold text-white">Create Account</h2>
          <p className="mt-1 text-xs text-slate-400">Request access to the operations platform.</p>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-slate-500">Full Name</span>
            <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-3">
              <UserRound className="h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-slate-500">Email</span>
            <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-3">
              <Mail className="h-3.5 w-3.5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-slate-500">Password</span>
            <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-3">
              <KeyRound className="h-3.5 w-3.5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Minimum 8 characters required.</p>
          </label>
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <div className="mt-5">
          <NeonButton
            className="w-full justify-center"
            onClick={handleSignup}
            disabled={loading || !name || !email || password.length < 8}
          >
            <UserPlus className="h-3.5 w-3.5" />
            {loading ? "Creating Account..." : "Create Account"}
          </NeonButton>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-400 transition hover:text-cyan-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
