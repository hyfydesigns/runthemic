import { NextResponse } from "next/server";
import { getOrganizerSession } from "@/server/auth";
import { hasEventPermission } from "@/server/permissions";
import { advanceQueue } from "@/server/queue";

export async function POST(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await hasEventPermission(eventId, session.user.id, "manage_songs");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const nowPlaying = await advanceQueue(eventId);
  return NextResponse.json({ nowPlaying });
}
