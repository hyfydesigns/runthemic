import { prisma } from "@/server/db";
import { getYoutubeClientForUser, markYoutubeConnectionInvalid } from "@/server/youtube/client";

export async function getEventOrganizerYoutubeClient(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { organizerId: true } });
  if (!event) return null;
  return getYoutubeClientForUser(event.organizerId);
}

/**
 * Creates (or returns the existing) YouTube playlist for an event, owned by
 * the organizer's connected account. Returns null if the organizer hasn't
 * connected YouTube — callers should treat the queue as DB-only in that case.
 */
export async function ensureEventPlaylist(eventId: string) {
  const existing = await prisma.eventPlaylist.findUnique({ where: { eventId } });
  if (existing) return existing;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");

  const client = await getEventOrganizerYoutubeClient(eventId);
  if (!client) return null;

  const connection = await prisma.youtubeConnection.findUnique({ where: { userId: event.organizerId } });
  const privacyStatus = connection?.defaultPlaylistPrivacy ?? "unlisted";

  const res = await client.playlists.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: { title: event.name, description: `Karaoke queue for ${event.name} — created by RunTheMic` },
      status: { privacyStatus: privacyStatus as "private" | "public" | "unlisted" },
    },
  });

  const playlistId = res.data.id;
  if (!playlistId) throw new Error("YouTube did not return a playlist id");

  return prisma.eventPlaylist.create({
    data: {
      eventId,
      youtubePlaylistId: playlistId,
      youtubePlaylistUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
      ownerUserId: event.organizerId,
      privacyStatus,
    },
  });
}

/** Best-effort: failures are logged, not thrown — the DB queue is the source of truth. */
export async function syncAddToYoutubePlaylist(eventId: string, queueItemId: string, youtubeVideoId: string) {
  try {
    // Auto-create the event's YouTube playlist on first song if the
    // organizer hasn't created one yet, so requests never silently sit
    // unsynced waiting for a manual "Create playlist" click.
    const playlist = await ensureEventPlaylist(eventId);
    if (!playlist) return;

    const client = await getEventOrganizerYoutubeClient(eventId);
    if (!client) return;

    const res = await client.playlistItems.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          playlistId: playlist.youtubePlaylistId,
          resourceId: { kind: "youtube#video", videoId: youtubeVideoId },
        },
      },
    });

    if (res.data.id) {
      await prisma.queueItem.update({
        where: { id: queueItemId },
        data: { youtubePlaylistItemId: res.data.id },
      });
    }
  } catch (err) {
    console.error(`Failed to sync queue item ${queueItemId} to YouTube playlist`, err);
    if (isAuthError(err)) {
      const event = await prisma.event.findUnique({ where: { id: eventId }, select: { organizerId: true } });
      if (event) await markYoutubeConnectionInvalid(event.organizerId);
    }
  }
}

/**
 * Syncs every queue item that isn't on the YouTube playlist yet — covers
 * songs requested before the playlist existed (auto-created or not) and any
 * earlier best-effort sync that failed and was never retried. Includes
 * PLAYED songs too: the playlist is the event's full setlist, not just
 * what's still upcoming, so already-played songs still belong on it.
 * Excludes only REJECTED/REMOVED, which were deliberately kept off.
 */
export async function syncAllUnsyncedQueueItems(eventId: string): Promise<number> {
  const unsynced = await prisma.queueItem.findMany({
    where: {
      eventId,
      youtubePlaylistItemId: null,
      status: { in: ["PENDING", "APPROVED", "PLAYING", "PLAYED"] },
    },
    orderBy: { createdAt: "asc" },
  });

  let synced = 0;
  for (const item of unsynced) {
    const before = item.youtubePlaylistItemId;
    await syncAddToYoutubePlaylist(eventId, item.id, item.youtubeVideoId);
    if (before === null) {
      const after = await prisma.queueItem.findUnique({
        where: { id: item.id },
        select: { youtubePlaylistItemId: true },
      });
      if (after?.youtubePlaylistItemId) synced += 1;
    }
  }
  return synced;
}

export async function syncRemoveFromYoutubePlaylist(eventId: string, youtubePlaylistItemId: string) {
  try {
    const client = await getEventOrganizerYoutubeClient(eventId);
    if (!client) return;
    await client.playlistItems.delete({ id: youtubePlaylistItemId });
  } catch (err) {
    console.error(`Failed to remove playlist item ${youtubePlaylistItemId} from YouTube`, err);
  }
}

function isAuthError(err: unknown): boolean {
  const code = (err as { code?: number })?.code;
  return code === 401 || code === 403;
}
