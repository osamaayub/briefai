import { Suspense } from "react";
import { logout } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/server/current-user";
import { briefService, isDemoMode } from "@/features/briefs/server";
import { BriefList } from "@/features/briefs/components/brief-list";
import { GenerateForm } from "@/features/briefs/components/generate-form";
import { UsageCard } from "@/features/briefs/components/usage-card";
import { Logo } from "@/components/logo";

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
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      </main>
    </div>
  );
}

async function Dashboard() {
  const user = await getCurrentUser();
  const service = briefService();
  const [briefs, usage] = await Promise.all([service.list(user.id), service.usage(user.id)]);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Hi {user.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-slate-400">Paste your notes and let AI do the rest.</p>
        </div>
        {isDemoMode() && (
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
            Demo mode: add OPENAI_API_KEY for real AI
          </span>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <GenerateForm remaining={usage.remaining} />
          <UsageCard used={usage.used} limit={usage.limit} />
        </div>
        <BriefList briefs={briefs} />
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid animate-pulse gap-6 lg:grid-cols-[420px_1fr]" aria-busy="true" aria-label="Loading dashboard">
      <div className="card h-80" />
      <div className="card h-48" />
    </div>
  );
}
