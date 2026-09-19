import { NextResponse } from "next/server";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { eventInputSchema } from "@/lib/validation/event";
import { updateEvent } from "@/server/events";
import { hasEventPermission } from "@/server/permissions";

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await hasEventPermission(eventId, session.user.id, "manage_rsvps");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ event });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await hasEventPermission(eventId, session.user.id, "full_edit");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = eventInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const event = await updateEvent(eventId, parsed.data);
  return NextResponse.json({ event });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { organizerId: true } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.organizerId !== session.user.id) {
    return NextResponse.json({ error: "Only the organizer can delete an event" }, { status: 403 });
  }

  await prisma.event.delete({ where: { id: eventId } });
  return NextResponse.json({ ok: true });
}
