import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";

const inviteSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["COHOST_FULL", "COHOST_SONGS", "COHOST_RSVPS"]),
});

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { organizerId: true } });
  if (!event || event.organizerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.eventMember.findMany({
    where: { eventId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });
  return NextResponse.json({ members });
}

export async function POST(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { organizerId: true } });
  if (!event || event.organizerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const invitee = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!invitee) {
    return NextResponse.json(
      { error: "No RunTheMic account found with that email yet — ask them to sign up first" },
      { status: 404 },
    );
  }
  if (invitee.id === session.user.id) {
    return NextResponse.json({ error: "You're already the organizer" }, { status: 400 });
  }

  const member = await prisma.eventMember.upsert({
    where: { eventId_userId: { eventId, userId: invitee.id } },
    create: { eventId, userId: invitee.id, role: parsed.data.role, acceptedAt: new Date() },
    update: { role: parsed.data.role },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json({ member });
}
