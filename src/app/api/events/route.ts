import { NextResponse } from "next/server";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { eventInputSchema } from "@/lib/validation/event";
import { createEvent } from "@/server/events";

export async function GET() {
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.event.findMany({
    where: {
      OR: [{ organizerId: session.user.id }, { members: { some: { userId: session.user.id } } }],
    },
    orderBy: { startsAt: "desc" },
  });
  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = eventInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const event = await createEvent(session.user.id, parsed.data);
  return NextResponse.json({ event });
}
