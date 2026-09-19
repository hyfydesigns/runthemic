import { NextResponse } from "next/server";
import { resolveEventRequester } from "@/server/request-identity";
import { getEventOrganizerYoutubeClient } from "@/server/youtube/playlist";
import { searchKaraokeVideos } from "@/server/youtube/search";

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const requester = await resolveEventRequester(eventId, "manage_songs");
  if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  const client = await getEventOrganizerYoutubeClient(eventId);
  if (!client) {
    return NextResponse.json({ results: [], error: "YouTube isn't connected for this event yet" }, { status: 200 });
  }

  try {
    const results = await searchKaraokeVideos(client, q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("YouTube search failed", err);
    // Google can take a few minutes to fully propagate a newly-granted
    // YouTube scope, so a freshly-connected account transiently 403s here —
    // give organizers a message that explains that instead of a bare retry.
    const status = (err as { status?: number; code?: number })?.status ?? (err as { code?: number })?.code;
    const message =
      status === 403
        ? "YouTube just connected — Google can take a few minutes to activate access. Try again shortly."
        : "Search failed, please try again";
    return NextResponse.json({ results: [], error: message }, { status: 200 });
  }
}
