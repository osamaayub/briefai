import { SignJWT, jwtVerify } from "jose";

// Pure JWT helpers, shared by the proxy and the server. No Next.js imports.
export const SESSION_COOKIE = "briefai_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionPayload = { userId: string };

const encode = (secret: string) => new TextEncoder().encode(secret);

export async function signSessionToken(payload: SessionPayload, secret: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(encode(secret));
}

export async function verifySessionToken(token: string | undefined, secret: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encode(secret), { algorithms: ["HS256"] });
    return typeof payload.userId === "string" ? { userId: payload.userId } : null;
  } catch {
    return null;
  }
}
