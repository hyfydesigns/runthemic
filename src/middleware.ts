import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route groups aren't part of the URL, so the organizer area is matched by
// its real paths (/dashboard, /settings, /events/*) minus the public,
// token-gated /events/[id]/tv display.
const PROTECTED_PREFIXES = ["/dashboard", "/settings", "/events"];
const PUBLIC_EVENT_SUFFIX = /\/tv$/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected =
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) &&
    !PUBLIC_EVENT_SUFFIX.test(pathname);

  if (!isProtected) return NextResponse.next();

  const sessionCookie =
    req.cookies.get("authjs.session-token") ?? req.cookies.get("__Secure-authjs.session-token");

  if (!sessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/events/:path*"],
};
