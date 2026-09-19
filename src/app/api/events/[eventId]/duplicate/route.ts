import { NextResponse } from "next/server";
import { getOrganizerSession } from "@/server/auth";
import { duplicateEvent } from "@/server/events";
import { hasEventPermission } from "@/server/permissions";

export async function POST(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await hasEventPermission(eventId, session.user.id, "full_edit");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const event = await duplicateEvent(eventId, session.user.id);
  return NextResponse.json({ event });
}
