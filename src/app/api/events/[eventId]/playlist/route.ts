import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getOrganizerSession } from "@/server/auth";
import { getGuestSession } from "@/server/guest-session";
import { hasEventPermission } from "@/server/permissions";
import { getEventQueueSnapshot } from "@/server/queue";
import { ensureEventPlaylist, syncAllUnsyncedQueueItems } from "@/server/youtube/playlist";

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  const session = await getOrganizerSession();
  const canManageSongs = session ? await hasEventPermission(eventId, session.user.id, "manage_songs") : false;
  const guestSession = session ? null : await getGuestSession(eventId);

  if (!canManageSongs && !guestSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pending, approved, playing } = await getEventQueueSnapshot(eventId);
  const playlist = await prisma.eventPlaylist.findUnique({ where: { eventId } });

  const mine = guestSession
    ? await prisma.queueItem.findMany({
        where: { eventId, guestSessionId: guestSession.id, status: { not: "REMOVED" } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return NextResponse.json({
    approved,
    playing,
    pending: canManageSongs ? pending : null,
    mine,
    playlist,
  });
}

export async function POST(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await hasEventPermission(eventId, session.user.id, "manage_songs");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const playlist = await ensureEventPlaylist(eventId);
  const synced = playlist ? await syncAllUnsyncedQueueItems(eventId) : 0;
  return NextResponse.json({ playlist, synced });
}
