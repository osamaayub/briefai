"use client";

import { useActionState } from "react";
import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { NOTES_MAX } from "../schemas";
import { generateBrief, type GenerateState } from "../actions";

export function GenerateForm({ remaining }: { remaining: number }) {
  const [state, action, pending] = useActionState<GenerateState, FormData>(generateBrief, { status: "idle" });
  const notes = state.status === "error" ? state.fields?.notes : undefined;

  return (
    <form action={action} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">New brief</h2>
        <span className="text-xs text-slate-400">{remaining} free left today</span>
      </div>
      <label htmlFor="notes" className="sr-only">Meeting notes</label>
      <textarea
        id="notes"
        name="notes"
        rows={7}
        maxLength={NOTES_MAX}
        className="input resize-none font-mono"
        placeholder="Paste your meeting notes here..."
        defaultValue={notes}
      />
      {state.status === "error" && <FormError message={state.message} />}
      <SubmitButton pending={pending} disabled={remaining <= 0} pendingLabel="Thinking..." className="w-full">
        ✦ Generate brief
      </SubmitButton>
    </form>
  );
}
