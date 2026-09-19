import type { youtube_v3 } from "googleapis";

export interface YoutubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
}

function parseIsoDuration(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
  if (!match) return null;
  const [, h, m, s] = match;
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

export async function searchKaraokeVideos(
  client: youtube_v3.Youtube,
  query: string,
): Promise<YoutubeSearchResult[]> {
  const searchRes = await client.search.list({
    part: ["snippet"],
    q: `${query} karaoke instrumental`,
    type: ["video"],
    videoEmbeddable: "true",
    maxResults: 15,
    safeSearch: "moderate",
  });

  const items = searchRes.data.items ?? [];
  const videoIds = items.map((i) => i.id?.videoId).filter((id): id is string => Boolean(id));
  if (videoIds.length === 0) return [];

  const detailsRes = await client.videos.list({ part: ["contentDetails"], id: videoIds });
  const durationById = new Map(
    (detailsRes.data.items ?? []).map((v) => [v.id, parseIsoDuration(v.contentDetails?.duration)]),
  );

  return items
    .filter((item) => item.id?.videoId)
    .map((item) => ({
      videoId: item.id!.videoId!,
      title: item.snippet?.title ?? "Untitled",
      channelTitle: item.snippet?.channelTitle ?? "",
      thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? null,
      durationSeconds: durationById.get(item.id!.videoId!) ?? null,
    }));
}
