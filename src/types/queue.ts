export interface QueueItemDTO {
  id: string;
  eventId: string;
  guestSessionId: string | null;
  youtubeVideoId: string;
  youtubeVideoTitle: string;
  youtubeChannelTitle: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  requestedBy: string | null;
  status: "PENDING" | "APPROVED" | "PLAYING" | "PLAYED" | "REJECTED" | "REMOVED";
  position: number;
  isPriority: boolean;
  youtubePlaylistItemId: string | null;
  createdAt: string;
  updatedAt: string;
  playedAt: string | null;
}

export interface QueueSnapshot {
  approved: QueueItemDTO[];
  playing: QueueItemDTO | null;
  pending: QueueItemDTO[] | null;
  mine: QueueItemDTO[];
  playlist: { youtubePlaylistUrl: string } | null;
}

export interface SearchResultDTO {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
