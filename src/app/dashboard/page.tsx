import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { briefs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { DAILY_LIMIT, usedToday } from "@/lib/usage";
import { isDemoMode } from "@/lib/ai";
import { logout } from "@/actions/auth";
import { Logo } from "@/components/logo";
import { GenerateForm } from "@/components/generate-form";
import { BriefCard } from "@/components/brief-card";

export default function DashboardPage() {
  return (
    <div className="glow min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <form action={logout}>
          <button className="btn-ghost">Log out</button>
        </form>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-20">
        {/* Reads the session cookie, so it streams in behind a Suspense boundary */}
        <Suspense fallback={<p className="text-slate-400">Loading your dashboard...</p>}>
          <Dashboard />
        </Suspense>
      </main>
    </div>
  );
}

async function Dashboard() {
  const user = await getCurrentUser();
  const [items, used] = await Promise.all([
    db.query.briefs.findMany({ where: eq(briefs.userId, user.id), orderBy: desc(briefs.createdAt) }),
    usedToday(user.id),
  ]);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Hi {user.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-slate-400">Paste your notes and let AI do the rest.</p>
        </div>
        {isDemoMode && (
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
            Demo mode: add OPENAI_API_KEY for real AI
          </span>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <GenerateForm remaining={Math.max(0, DAILY_LIMIT - used)} />
          <div className="card">
            <p className="text-sm text-slate-400">Used today</p>
            <p className="mt-1 text-2xl font-bold">{used} / {DAILY_LIMIT}</p>
            <div className="mt-3 h-2 rounded-full bg-line">
              <div className="h-2 rounded-full bg-gradient-to-r from-brand to-brand-2" style={{ width: `${Math.min(100, (used / DAILY_LIMIT) * 100)}%` }} />
            </div>
          </div>
        </div>
        <section className="space-y-4">
          <h2 className="font-semibold text-slate-300">Your briefs ({items.length})</h2>
          {items.length === 0 ? (
            <div className="card text-center text-slate-400">No briefs yet. Generate your first one.</div>
          ) : (
            items.map((b) => <BriefCard key={b.id} brief={b} />)
          )}
        </section>
      </div>
    </>
  );
}
