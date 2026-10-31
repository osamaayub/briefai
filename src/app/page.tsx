import Link from "next/link";
import { Logo } from "@/components/logo";

const features = [
  { icon: "⚡", title: "Instant briefs", text: "Paste raw notes and get a title, a short summary and clear next steps." },
  { icon: "🔒", title: "Private by design", text: "Your API key and data stay on the server. Every request is checked." },
  { icon: "📊", title: "Usage limits", text: "A free plan with a daily limit, ready for you to add paid tiers." },
];

export default function Home() {
  return (
    <div className="glow min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">Log in</Link>
          <Link href="/signup" className="btn-primary">Get started</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16 text-center">
        <p className="mx-auto mb-6 w-fit rounded-full border border-line px-4 py-1 text-xs text-slate-300">
          Next.js · Drizzle · libSQL · OpenAI
        </p>
        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
          Turn messy notes into{" "}
          <span className="bg-gradient-to-r from-brand to-brand-2 bg-clip-text text-transparent">clear action items</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
          BriefAI reads your meeting notes and gives you a summary and a to-do list in seconds.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link href="/signup" className="btn-primary px-7 py-3 text-base">Start for free</Link>
          <Link href="/login" className="btn-ghost px-7 py-3 text-base">I have an account</Link>
        </div>

        <section className="mt-24 grid gap-5 text-left md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card">
              <div className="mb-4 text-2xl">{f.icon}</div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
