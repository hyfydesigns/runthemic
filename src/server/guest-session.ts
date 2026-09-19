import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/server/db";

const GUEST_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

function getSecretKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set — required to sign guest sessions");
  return new TextEncoder().encode(secret);
}

function cookieName(eventId: string): string {
  return `rtm_guest_${eventId}`;
}

interface GuestTokenPayload {
  gsid: string;
  eventId: string;
}

export async function issueGuestSessionCookie(eventId: string, guestSessionId: string) {
  const token = await new SignJWT({ gsid: guestSessionId, eventId } satisfies GuestTokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${GUEST_TOKEN_TTL_SECONDS}s`)
    .sign(getSecretKey());

  const store = await cookies();
  store.set(cookieName(eventId), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_TOKEN_TTL_SECONDS,
  });
}

/**
 * Resolves the current guest's session row for an event from their signed
 * cookie, verifying the token against the DB-stored sessionToken so a
 * session can be invalidated server-side without touching the JWT secret.
 */
export async function getGuestSession(eventId: string) {
  const store = await cookies();
  const token = store.get(cookieName(eventId))?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify<GuestTokenPayload>(token, getSecretKey());
    if (payload.eventId !== eventId || !payload.gsid) return null;

    const guestSession = await prisma.guestSession.findUnique({ where: { id: payload.gsid } });
    if (!guestSession || guestSession.eventId !== eventId) return null;

    return guestSession;
  } catch {
    return null;
  }
}

export async function clearGuestSessionCookie(eventId: string) {
  const store = await cookies();
  store.delete(cookieName(eventId));
}
