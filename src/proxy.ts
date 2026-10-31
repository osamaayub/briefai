import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const key = new TextEncoder().encode(process.env.SESSION_SECRET);

// Optimistic check only. The real check happens again on the server (getCurrentUser).
export async function proxy(req: NextRequest) {
  const token = req.cookies.get("briefai_session")?.value;
  const loggedIn = token ? await jwtVerify(token, key).then(() => true, () => false) : false;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard") && !loggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if ((pathname === "/login" || pathname === "/signup") && loggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/login", "/signup"] };
