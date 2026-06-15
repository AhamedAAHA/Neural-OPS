"use client";

<<<<<<< HEAD
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
=======
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, Radio, ShieldCheck, UserPlus, LogIn } from "lucide-react";
import Link from "next/link";
import { NeonButton } from "@/components/ui/NeonButton";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";

export default function SignUpPage() {
  return (
    <Suspense fallback={<AuthShell><p className="text-center text-sm text-slate-400">Loading...</p></AuthShell>}>
      <SignUpClient />
>>>>>>> 72bf83a3565b3df2dab53da2c8256ec3758038fb
    </Suspense>
  );
}

<<<<<<< HEAD
function SignupFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-premium w-full max-w-md rounded-xl border border-cyan-500/25 p-6">
        <p className="text-center text-sm text-slate-300">Loading registration...</p>
=======
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
>>>>>>> 72bf83a3565b3df2dab53da2c8256ec3758038fb
      </div>
    </div>
  );
}

<<<<<<< HEAD
function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || "/command-center", [searchParams]);

=======
function SignUpClient() {
  const router = useRouter();
>>>>>>> 72bf83a3565b3df2dab53da2c8256ec3758038fb
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

<<<<<<< HEAD
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
=======
  const handleSignUp = async () => {
    setError(null);
    if (!name.trim()) { setError("Please enter your full name."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);

    try {
      const supabase = createSupabaseBrowser();
      if (!supabase) { setError("Auth service unavailable."); return; }

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: { full_name: name.trim() },
        },
      });

      if (signUpError) {
        setError(signUpError.message || "Sign up failed.");
        return;
      }

      router.push("/signup/success");
>>>>>>> 72bf83a3565b3df2dab53da2c8256ec3758038fb
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
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
=======
    <AuthShell>
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-cyan-400" />
          <h1 className="font-display text-lg font-semibold text-white">Create Account</h1>
        </div>
        <p className="font-mono text-[11px] text-slate-500">
          Request access to the operations platform
        </p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">
            Full Name
          </span>
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 transition-colors focus-within:border-cyan-500/50">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              autoComplete="name"
              className="w-full bg-transparent py-3 font-mono text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>
        </label>

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
              onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              className="w-full bg-transparent py-3 font-mono text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>
          <p className="mt-1 font-mono text-[10px] text-slate-600">Minimum 8 characters required</p>
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
          onClick={handleSignUp}
          disabled={loading || !email || !password || !name}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {loading ? "Creating Account..." : "Create Account"}
        </NeonButton>

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="font-mono text-[10px] text-slate-600">or</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <Link
          href="/login"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/50 py-2.5 font-mono text-xs text-slate-400 transition-colors hover:border-cyan-500/30 hover:text-cyan-400"
        >
          <LogIn className="h-3.5 w-3.5" />
          Already have an account? Sign in
        </Link>
      </div>
    </AuthShell>
>>>>>>> 72bf83a3565b3df2dab53da2c8256ec3758038fb
  );
}
