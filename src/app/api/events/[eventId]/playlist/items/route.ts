import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveEventRequester } from "@/server/request-identity";
import { addSongRequest } from "@/server/queue";

const addItemSchema = z.object({
  youtubeVideoId: z.string().min(1),
  youtubeVideoTitle: z.string().min(1),
  youtubeChannelTitle: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  durationSeconds: z.number().int().positive().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const requester = await resolveEventRequester(eventId, "manage_songs");
  if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { item, duplicate } = await addSongRequest(eventId, {
    ...parsed.data,
    guestSessionId: requester.kind === "guest" ? requester.guestSessionId : null,
    requestedBy: requester.displayName,
  });

  return NextResponse.json({ item, duplicate });
}
