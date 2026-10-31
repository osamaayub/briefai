import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/features/auth/server/token";

const AUTH_PAGES = new Set(["/login", "/signup"]);

// Optimistic check only (no database). The authoritative check is getCurrentUser().
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value, process.env.SESSION_SECRET ?? "");

  if (pathname.startsWith("/dashboard") && !session) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }
  if (AUTH_PAGES.has(pathname) && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/login", "/signup"] };
