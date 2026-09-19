import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getOrganizerSession } from "@/server/auth";

async function assertOrganizer(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { organizerId: true } });
  return event?.organizerId === userId;
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ eventId: string; memberId: string }> },
) {
  const { eventId, memberId } = await params;
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await assertOrganizer(eventId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.eventMember.delete({ where: { id: memberId } });
  return NextResponse.json({ ok: true });
}
