import type { Brief } from "../types";
import { BriefCard } from "./brief-card";

export function BriefList({ briefs }: { briefs: Brief[] }) {
  return (
    <section className="space-y-4" aria-label="Your briefs">
      <h2 className="font-semibold text-slate-300">Your briefs ({briefs.length})</h2>
      {briefs.length === 0 ? (
        <div className="card text-center text-slate-400">No briefs yet. Generate your first one.</div>
      ) : (
        briefs.map((b) => <BriefCard key={b.id} brief={b} />)
      )}
    </section>
  );
}
