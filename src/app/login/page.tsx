"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, LogIn, Mail, ShieldCheck } from "lucide-react";
import { NeonButton } from "@/components/ui/NeonButton";

type LoginMode = "password" | "otp";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-premium w-full max-w-md rounded-xl border border-cyan-500/25 p-6">
        <p className="text-center text-sm text-slate-300">Loading secure access...</p>
      </div>
    </div>
  );
}

function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || "/command-center", [searchParams]);

  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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

  const handlePasswordLogin = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }
      router.replace(nextPath);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCode = async () => {
    setError(null);
    setMessage(null);
    setRequestingCode(true);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to request code.");
        return;
      }
      setMessage(data.message ?? "Login code is ready.");
    } finally {
      setRequestingCode(false);
    }
  };

  const handleCodeLogin = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Invalid code.");
        return;
      }
      router.replace(nextPath);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-premium w-full max-w-md rounded-xl border border-cyan-500/25 p-6">
        <div className="mb-5">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/10">
            <ShieldCheck className="h-5 w-5 text-cyan-300" />
          </div>
          <h1 className="font-display text-xl font-semibold text-white">Secure Access</h1>
          <p className="mt-1 text-xs text-slate-400">Sign in to Neural OPS Command Network</p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`rounded-md border px-3 py-2 text-xs transition ${
              mode === "password"
                ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
                : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600"
            }`}
          >
            Password Login
          </button>
          <button
            type="button"
            onClick={() => setMode("otp")}
            className={`rounded-md border px-3 py-2 text-xs transition ${
              mode === "otp"
                ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
                : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600"
            }`}
          >
            Login Code
          </button>
        </div>

        <div className="space-y-3">
          {mode === "password" && (
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-slate-500">Email</span>
              <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-3">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@neural-ops.ai"
                  className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </label>
          )}

          {mode === "password" ? (
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-slate-500">Password</span>
              <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-3">
                <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </label>
          ) : (
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-slate-500">Login Code</span>
              <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-3">
                <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter login code"
                  className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </label>
          )}
        </div>

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
        {message && <p className="mt-3 text-xs text-emerald-400">{message}</p>}

        <div className="mt-5 space-y-2">
          {mode === "password" ? (
            <NeonButton className="w-full justify-center" onClick={handlePasswordLogin} disabled={loading}>
              <LogIn className="h-3.5 w-3.5" />
              {loading ? "Signing In..." : "Sign In"}
            </NeonButton>
          ) : (
            <>
              <NeonButton
                variant="ghost"
                className="w-full justify-center"
                onClick={handleRequestCode}
                disabled={requestingCode}
              >
                {requestingCode ? "Getting Code..." : "Show Login Code"}
              </NeonButton>
              <NeonButton className="w-full justify-center" onClick={handleCodeLogin} disabled={loading || !code}>
                <LogIn className="h-3.5 w-3.5" />
                {loading ? "Signing In..." : "Login With Code"}
              </NeonButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
