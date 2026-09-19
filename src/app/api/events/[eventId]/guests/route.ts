import { NextResponse } from "next/server";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { hasEventPermission } from "@/server/permissions";

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await hasEventPermission(eventId, session.user.id, "manage_rsvps");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const guests = await prisma.guestSession.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ guests });
}
