"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/result";
import { logger } from "@/server/logger";
import { LoginSchema, SignupSchema } from "./schemas";
import { createSession, destroySession } from "./server/session";
import { hashPassword, verifyPassword } from "./server/password";
import { userRepository } from "./server/user-repository";

export type AuthFields = { name: string; email: string };
export type AuthState = ActionState<AuthFields>;

const echo = (f: FormData): Partial<AuthFields> => ({
  name: String(f.get("name") ?? ""),
  email: String(f.get("email") ?? ""),
});

export async function signup(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = SignupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message, fields: echo(formData) };

  const { name, email, password } = parsed.data;
  if (await userRepository.existsByEmail(email)) {
    return { status: "error", message: "An account with this email already exists", fields: echo(formData) };
  }

  const user = await userRepository.create({ name, email, passwordHash: await hashPassword(password) });
  logger.info("user.signup", { userId: user.id });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message, fields: echo(formData) };

  const { email, password } = parsed.data;
  const creds = await userRepository.findCredentialsByEmail(email);
  if (!(await verifyPassword(password, creds?.passwordHash)) || !creds) {
    logger.warn("user.login_failed");
    return { status: "error", message: "Wrong email or password", fields: echo(formData) };
  }

  await createSession(creds.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
