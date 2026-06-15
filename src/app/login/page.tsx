"use client";

<<<<<<< HEAD
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, LogIn, Mail, ShieldCheck } from "lucide-react";
=======
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn, Mail, Radio, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
>>>>>>> 72bf83a3565b3df2dab53da2c8256ec3758038fb
import { NeonButton } from "@/components/ui/NeonButton";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthShell><p className="text-center text-sm text-slate-400">Loading secure access...</p></AuthShell>}>
      <LoginClient />
    </Suspense>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/10">
            <Radio className="h-5 w-5 text-cyan-400" />
          </div>
          <span className="font-display text-base font-bold tracking-widest text-white">{APP_NAME}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Enterprise Risk &amp; Decision Platform
          </span>
        </div>
        <div className="glass-premium rounded-2xl border border-cyan-500/20 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      if (!supabase) { setError("Auth service unavailable."); return; }

      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) {
        setError(authError.message || "Invalid email or password.");
        return;
      }
      router.replace("/command-center");
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-premium w-full max-w-md rounded-xl border border-cyan-500/25 p-6">
        <div className="mb-5">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/10">
            <ShieldCheck className="h-5 w-5 text-cyan-300" />
          </div>
          <h1 className="font-display text-xl font-semibold text-white">Secure Access</h1>
          <p className="mt-1 text-xs text-slate-400">
            Sign in with a seeded organization account. First login creates your Supabase credential.
          </p>
          <p className="mt-2 font-mono text-[10px] text-slate-500">
            e.g. admin@neural-ops.io · analyst@neural-ops.io
          </p>
        </div>

        <div className="space-y-3">
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
                placeholder="Enter password"
                className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </label>
        </div>

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <div className="mt-5">
          <NeonButton className="w-full justify-center" onClick={handlePasswordLogin} disabled={loading || !email || !password}>
            <LogIn className="h-3.5 w-3.5" />
            {loading ? "Signing In..." : "Sign In"}
          </NeonButton>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-cyan-400 transition hover:text-cyan-300">
            Create account
          </Link>
=======
    <AuthShell>
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-cyan-400" />
          <h1 className="font-display text-lg font-semibold text-white">Secure Sign In</h1>
        </div>
        <p className="font-mono text-[11px] text-slate-500">
          Access your operations console
>>>>>>> 72bf83a3565b3df2dab53da2c8256ec3758038fb
        </p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">
            Work Email
          </span>
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 transition-colors focus-within:border-cyan-500/50">
            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="you@company.com"
              autoComplete="email"
              className="w-full bg-transparent py-3 font-mono text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">
            Password
          </span>
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 transition-colors focus-within:border-cyan-500/50">
            <KeyRound className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-transparent py-3 font-mono text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>
        </label>
      </div>

      {error && (
        <p className="mt-3 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 font-mono text-[11px] text-red-400">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-3">
        <NeonButton
          className="w-full justify-center"
          onClick={handleLogin}
          disabled={loading || !email || !password}
        >
          <LogIn className="h-3.5 w-3.5" />
          {loading ? "Authenticating..." : "Sign In"}
        </NeonButton>

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="font-mono text-[10px] text-slate-600">or</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <Link
          href="/signup"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/50 py-2.5 font-mono text-xs text-slate-400 transition-colors hover:border-cyan-500/30 hover:text-cyan-400"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Create an account
        </Link>
      </div>
    </AuthShell>
  );
}
