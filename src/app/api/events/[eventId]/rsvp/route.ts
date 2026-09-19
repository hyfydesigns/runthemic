import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { rsvpSchema } from "@/lib/validation/event";
import { submitRsvp } from "@/server/rsvp";
import { getGuestSession, issueGuestSessionCookie } from "@/server/guest-session";
import { verifyTurnstileToken } from "@/server/turnstile";
import { notifyRsvp } from "@/server/notifications";

export async function POST(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, status: true } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.status === "CANCELLED") {
    return NextResponse.json({ error: "This event has been cancelled" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const existing = await getGuestSession(eventId);

  // Returning guests changing their RSVP already proved they're human the
  // first time — only gate the initial RSVP, when a cookie doesn't exist yet.
  if (!existing) {
    const humanVerified = await verifyTurnstileToken(parsed.data.turnstileToken);
    if (!humanVerified) {
      return NextResponse.json({ error: "Spam check failed — please try again" }, { status: 400 });
    }
  }

  const { guestSession, waitlisted } = await submitRsvp(eventId, parsed.data, existing?.id ?? null);

  await issueGuestSessionCookie(eventId, guestSession.id);

  // Fire-and-forget: emails shouldn't hold up the guest's RSVP response.
  notifyRsvp(eventId, guestSession, !existing).catch((err) => console.error("[notifyRsvp] failed:", err));

  return NextResponse.json({ guestSession, waitlisted });
}
