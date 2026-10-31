import "server-only";
import { cookies } from "next/headers";
import { env } from "@/server/env";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSessionToken, verifySessionToken } from "./token";

export async function createSession(userId: string) {
  const token = await signSessionToken({ userId }, env().SESSION_SECRET);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function readSession() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value, env().SESSION_SECRET);
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}
