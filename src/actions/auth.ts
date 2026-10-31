"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, deleteSession } from "@/lib/session";

export type AuthState = { error?: string; fields?: { name?: string; email?: string } } | undefined;

const keep = (f: FormData) => ({ name: String(f.get("name") ?? ""), email: String(f.get("email") ?? "") });

const SignupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const LoginSchema = z.object({
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase()),
  password: z.string().min(1, "Enter your password"),
});

export async function signup(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = SignupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: keep(formData) };

  const { name, email, password } = parsed.data;
  const exists = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (exists) return { error: "An account with this email already exists", fields: keep(formData) };

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(users).values({ name, email, passwordHash }).returning({ id: users.id });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: keep(formData) };

  const { email, password } = parsed.data;
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!user || !ok) return { error: "Wrong email or password", fields: keep(formData) };

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
