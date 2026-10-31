"use client";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="glow flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-slate-400">We couldn&apos;t load your dashboard. Please try again.</p>
      <button onClick={reset} className="btn-primary">Try again</button>
    </div>
  );
}
