import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="max-w-md rounded-xl border border-cyan-500/20 bg-slate-900/80 p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">404</p>
        <h1 className="mt-2 text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-slate-400">The requested route does not exist in Neural OPS.</p>
        <Link
          href="/"
          className="mt-4 inline-flex rounded-md border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
