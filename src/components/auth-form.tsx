"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup } from "@/actions/auth";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action, pending] = useActionState(mode === "login" ? login : signup, undefined);
  const isSignup = mode === "signup";

  return (
    <form action={action} className="card w-full max-w-md space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {isSignup ? "Start with 5 free briefs every day." : "Log in to see your briefs."}
        </p>
      </div>
      {isSignup && <input name="name" placeholder="Your name" className="input" defaultValue={state?.fields?.name} required />}
      <input name="email" type="email" placeholder="you@example.com" className="input" defaultValue={state?.fields?.email} required />
      <input name="password" type="password" placeholder="Password (8+ characters)" className="input" required />
      {state?.error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Please wait..." : isSignup ? "Create account" : "Log in"}
      </button>
      <p className="text-center text-sm text-slate-400">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link href={isSignup ? "/login" : "/signup"} className="text-brand-2 hover:underline">
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
