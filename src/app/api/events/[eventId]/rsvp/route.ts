import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { rsvpSchema } from "@/lib/validation/event";
import { submitRsvp } from "@/server/rsvp";
import { getGuestSession, issueGuestSessionCookie } from "@/server/guest-session";

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
  const { guestSession, waitlisted } = await submitRsvp(eventId, parsed.data, existing?.id ?? null);

  await issueGuestSessionCookie(eventId, guestSession.id);

  return NextResponse.json({ guestSession, waitlisted });
}
