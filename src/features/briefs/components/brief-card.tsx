import { deleteBrief } from "../actions";
import type { Brief } from "../types";

const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function BriefCard({ brief }: { brief: Brief }) {
  return (
    <article className="card space-y-3" aria-labelledby={`brief-${brief.id}`}>
      <div className="flex items-start justify-between gap-4">
        <h3 id={`brief-${brief.id}`} className="text-lg font-semibold">{brief.title}</h3>
        <form action={deleteBrief.bind(null, brief.id)}>
          <button className="text-xs text-slate-500 hover:text-red-300" aria-label={`Delete ${brief.title}`}>Delete</button>
        </form>
      </div>
      <p className="text-sm leading-relaxed text-slate-300">{brief.summary}</p>
      <ul className="space-y-2">
        {brief.actionItems.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-brand/20 text-[10px] text-brand-2">✓</span>
            {item}
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">{dateFmt.format(brief.createdAt)}</p>
    </article>
  );
}
