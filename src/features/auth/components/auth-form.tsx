"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { login, signup, type AuthState } from "../actions";

const COPY = {
  login: { title: "Welcome back", sub: "Log in to see your briefs.", cta: "Log in", alt: "New here? ", altLink: "Create an account", href: "/signup" },
  signup: { title: "Create your account", sub: "Start with 5 free briefs every day.", cta: "Create account", alt: "Already have an account? ", altLink: "Log in", href: "/login" },
} as const;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : signup, { status: "idle" });
  const copy = COPY[mode];
  const fields = state.status === "error" ? state.fields : undefined;

  return (
    <form action={action} className="card w-full max-w-md space-y-4" noValidate>
      <div>
        <h1 className="text-2xl font-bold">{copy.title}</h1>
        <p className="mt-1 text-sm text-slate-400">{copy.sub}</p>
      </div>
      {mode === "signup" && (
        <input name="name" placeholder="Your name" autoComplete="name" className="input" defaultValue={fields?.name} required />
      )}
      <input name="email" type="email" placeholder="you@example.com" autoComplete="email" className="input" defaultValue={fields?.email} required />
      <input
        name="password"
        type="password"
        placeholder="Password (8+ characters)"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        className="input"
        required
      />
      {state.status === "error" && <FormError message={state.message} />}
      <SubmitButton pending={pending} className="w-full">{copy.cta}</SubmitButton>
      <p className="text-center text-sm text-slate-400">
        {copy.alt}
        <Link href={copy.href} className="text-brand-2 hover:underline">{copy.altLink}</Link>
      </p>
    </form>
  );
}
