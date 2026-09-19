import { prisma } from "@/server/db";
import { emitToEvent } from "@/server/socket";
import { syncAddToYoutubePlaylist, syncRemoveFromYoutubePlaylist } from "@/server/youtube/playlist";
import type { QueueItemStatus } from "@prisma/client";

const POSITION_STEP = 1000;
const ACTIVE_STATUSES: QueueItemStatus[] = ["PENDING", "APPROVED", "PLAYING"];

export async function getEventQueueSnapshot(eventId: string) {
  const [pending, approved, playing] = await Promise.all([
    prisma.queueItem.findMany({ where: { eventId, status: "PENDING" }, orderBy: { createdAt: "asc" } }),
    prisma.queueItem.findMany({
      where: { eventId, status: "APPROVED" },
      orderBy: [{ isPriority: "desc" }, { position: "asc" }],
    }),
    prisma.queueItem.findFirst({ where: { eventId, status: "PLAYING" } }),
  ]);
  return { pending, approved, playing };
}

async function nextPosition(eventId: string): Promise<number> {
  const last = await prisma.queueItem.findFirst({
    where: { eventId, status: { in: ["APPROVED", "PLAYING"] } },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return (last?.position ?? 0) + POSITION_STEP;
}

export interface AddSongRequestInput {
  youtubeVideoId: string;
  youtubeVideoTitle: string;
  youtubeChannelTitle?: string | null;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  guestSessionId?: string | null;
  requestedBy: string;
}

export async function addSongRequest(eventId: string, input: AddSongRequestInput) {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });

  const duplicate = await prisma.queueItem.findFirst({
    where: { eventId, youtubeVideoId: input.youtubeVideoId, status: { in: ACTIVE_STATUSES } },
  });
  if (duplicate) {
    return { item: duplicate, duplicate: true as const };
  }

  const autoApprove = event.autoApproveRequests;
  const item = await prisma.queueItem.create({
    data: {
      eventId,
      guestSessionId: input.guestSessionId ?? null,
      youtubeVideoId: input.youtubeVideoId,
      youtubeVideoTitle: input.youtubeVideoTitle,
      youtubeChannelTitle: input.youtubeChannelTitle ?? null,
      thumbnailUrl: input.thumbnailUrl ?? null,
      durationSeconds: input.durationSeconds ?? null,
      requestedBy: input.requestedBy,
      status: autoApprove ? "APPROVED" : "PENDING",
      position: autoApprove ? await nextPosition(eventId) : 0,
    },
  });

  await syncAddToYoutubePlaylist(eventId, item.id, item.youtubeVideoId);
  // Re-read after sync: the in-memory `item` predates the sync's DB update
  // (it only sets youtubePlaylistItemId on the row, not this object), so
  // without this both the emitted event and the API response would report
  // the song as unsynced even when it just succeeded.
  const synced = (await prisma.queueItem.findUnique({ where: { id: item.id } })) ?? item;

  if (autoApprove) {
    emitToEvent(eventId, "queue:update", await getEventQueueSnapshot(eventId));
  } else {
    emitToEvent(eventId, "song:requested", { eventId, item: synced });
  }

  return { item: synced, duplicate: false as const };
}

export async function approveSongRequest(eventId: string, itemId: string) {
  const item = await prisma.queueItem.update({
    where: { id: itemId },
    data: { status: "APPROVED", position: await nextPosition(eventId) },
  });
  emitToEvent(eventId, "song:approved", { eventId, itemId });
  emitToEvent(eventId, "queue:update", await getEventQueueSnapshot(eventId));
  return item;
}

export async function rejectSongRequest(eventId: string, itemId: string) {
  const item = await prisma.queueItem.update({ where: { id: itemId }, data: { status: "REJECTED" } });
  emitToEvent(eventId, "song:rejected", { eventId, itemId });
  return item;
}

export async function removeSongRequest(eventId: string, itemId: string) {
  const item = await prisma.queueItem.update({ where: { id: itemId }, data: { status: "REMOVED" } });
  if (item.youtubePlaylistItemId) {
    await syncRemoveFromYoutubePlaylist(eventId, item.youtubePlaylistItemId);
  }
  emitToEvent(eventId, "song:removed", { eventId, itemId });
  emitToEvent(eventId, "queue:update", await getEventQueueSnapshot(eventId));
  return item;
}

export async function setSongPriority(eventId: string, itemId: string, isPriority: boolean) {
  const item = await prisma.queueItem.update({ where: { id: itemId }, data: { isPriority } });
  emitToEvent(eventId, "queue:update", await getEventQueueSnapshot(eventId));
  return item;
}

/** Marks the currently-PLAYING item PLAYED (if any) and promotes the next APPROVED item to PLAYING. */
export async function advanceQueue(eventId: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.queueItem.findFirst({ where: { eventId, status: "PLAYING" } });
    if (current) {
      await tx.queueItem.update({ where: { id: current.id }, data: { status: "PLAYED", playedAt: new Date() } });
    }

    const next = await tx.queueItem.findFirst({
      where: { eventId, status: "APPROVED" },
      orderBy: [{ isPriority: "desc" }, { position: "asc" }],
    });
    if (next) {
      await tx.queueItem.update({ where: { id: next.id }, data: { status: "PLAYING" } });
    }

    return next ?? null;
  }).then(async (next) => {
    emitToEvent(eventId, "nowplaying:change", { eventId, item: next });
    emitToEvent(eventId, "queue:update", await getEventQueueSnapshot(eventId));
    return next;
  });
}
