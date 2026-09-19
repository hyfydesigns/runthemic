import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getOrganizerSession } from "@/server/auth";
import { getGuestSession } from "@/server/guest-session";
import { hasEventPermission } from "@/server/permissions";
import { approveSongRequest, rejectSongRequest, removeSongRequest, setSongPriority } from "@/server/queue";

const patchSchema = z.object({
  action: z.enum(["approve", "reject", "setPriority", "clearPriority"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ eventId: string; itemId: string }> },
) {
  const { eventId, itemId } = await params;
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await hasEventPermission(eventId, session.user.id, "manage_songs");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  switch (parsed.data.action) {
    case "approve":
      return NextResponse.json({ item: await approveSongRequest(eventId, itemId) });
    case "reject":
      return NextResponse.json({ item: await rejectSongRequest(eventId, itemId) });
    case "setPriority":
      return NextResponse.json({ item: await setSongPriority(eventId, itemId, true) });
    case "clearPriority":
      return NextResponse.json({ item: await setSongPriority(eventId, itemId, false) });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ eventId: string; itemId: string }> },
) {
  const { eventId, itemId } = await params;

  const session = await getOrganizerSession();
  const canManage = session ? await hasEventPermission(eventId, session.user.id, "manage_songs") : false;

  if (!canManage) {
    const guestSession = await getGuestSession(eventId);
    const item = await prisma.queueItem.findUnique({ where: { id: itemId } });
    if (!guestSession || !item || item.guestSessionId !== guestSession.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const item = await removeSongRequest(eventId, itemId);
  return NextResponse.json({ item });
}
