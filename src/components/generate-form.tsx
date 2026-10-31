"use client";

import { useActionState } from "react";
import { generateBrief } from "@/actions/briefs";

export function GenerateForm({ remaining }: { remaining: number }) {
  const [state, action, pending] = useActionState(generateBrief, undefined);
  return (
    <form action={action} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">New brief</h2>
        <span className="text-xs text-slate-400">{remaining} free left today</span>
      </div>
      <textarea
        name="notes"
        rows={7}
        className="input resize-none font-mono"
        placeholder="Paste your meeting notes here..."
        defaultValue={state?.notes}
      />
      {state?.error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending || remaining <= 0}>
        {pending ? "Thinking..." : "✦ Generate brief"}
      </button>
    </form>
  );
}
