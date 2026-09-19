import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route groups aren't part of the URL, so the organizer area is matched by
// its real paths (/dashboard, /settings, /events/*) minus the public,
// token-gated /events/[id]/tv display.
const PROTECTED_PREFIXES = ["/dashboard", "/settings", "/events"];
const PUBLIC_EVENT_SUFFIX = /\/tv$/;

// Railway keeps its auto-generated *.up.railway.app domain live alongside a
// custom domain rather than retiring it, so both still resolve to this same
// deployment. Anyone landing on the old one (bookmark, stale link, browser
// history) needs to be bounced to the canonical domain — otherwise every
// relative link/redirect on that page quietly keeps them on the wrong host.
const CANONICAL_HOST = (() => {
  try {
    return new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000").host;
  } catch {
    return null;
  }
})();

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const host = req.headers.get("host");
  if (CANONICAL_HOST && host && host !== CANONICAL_HOST) {
    const canonicalUrl = new URL(`${pathname}${req.nextUrl.search}`, `https://${CANONICAL_HOST}`);
    return NextResponse.redirect(canonicalUrl, 308);
  }

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
  // Runs on every page/API request (except static assets) so the canonical-
  // domain redirect above applies site-wide, not just the protected routes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|sw.js).*)"],
};
