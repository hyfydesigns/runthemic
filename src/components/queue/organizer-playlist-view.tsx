"use client";

import { useCallback, useEffect, useState } from "react";
import { RealtimeProvider, useEventRoom, useSocketEvent, usePollingRefetch } from "@/hooks/useRealtime";
import { SongSearchBox } from "@/components/queue/song-search-box";
import { QueueItemRow } from "@/components/queue/queue-item-row";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkipForward, Youtube, RefreshCw } from "lucide-react";
import type { QueueSnapshot } from "@/types/queue";

export function OrganizerPlaylistView({ eventId, youtubeConfigured }: { eventId: string; youtubeConfigured: boolean }) {
  return (
    <RealtimeProvider>
      <OrganizerPlaylistInner eventId={eventId} youtubeConfigured={youtubeConfigured} />
    </RealtimeProvider>
  );
}

function OrganizerPlaylistInner({ eventId, youtubeConfigured }: { eventId: string; youtubeConfigured: boolean }) {
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/playlist`);
    if (res.ok) setSnapshot(await res.json());
  }, [eventId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEventRoom(eventId, refetch);
  useSocketEvent("queue:update", () => refetch());
  useSocketEvent("song:requested", () => refetch());
  useSocketEvent("nowplaying:change", () => refetch());
  usePollingRefetch(refetch);

  async function act(itemId: string, action: string) {
    await fetch(`/api/events/${eventId}/playlist/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    refetch();
  }

  async function remove(itemId: string) {
    await fetch(`/api/events/${eventId}/playlist/items/${itemId}`, { method: "DELETE" });
    refetch();
  }

  async function advance() {
    await fetch(`/api/events/${eventId}/playlist/advance`, { method: "POST" });
    refetch();
  }

  async function syncPlaylist() {
    setSyncing(true);
    setSyncMessage(null);
    const res = await fetch(`/api/events/${eventId}/playlist`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setSyncing(false);
    if (typeof data.synced === "number") {
      setSyncMessage(data.synced > 0 ? `Synced ${data.synced} song${data.synced === 1 ? "" : "s"} to YouTube.` : "Everything is already synced.");
    } else if (typeof data.message === "string") {
      setSyncMessage(data.message);
    } else {
      setSyncMessage("Couldn't sync — please try again.");
    }
    refetch();
  }

  if (!snapshot) return <p className="text-sm text-muted-foreground">Loading queue...</p>;

  const unsyncedCount = [...snapshot.approved, ...(snapshot.pending ?? []), ...(snapshot.playing ? [snapshot.playing] : [])].filter(
    (item) => !item.youtubePlaylistItemId,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {!youtubeConfigured ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-2 py-4 text-sm">
            <Youtube className="h-5 w-5 text-primary" />
            YouTube isn&apos;t connected — the queue still works, songs just won&apos;t sync to a real playlist.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex flex-col gap-0.5 text-sm">
              {snapshot.playlist ? (
                <a
                  href={snapshot.playlist.youtubePlaylistUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                >
                  <Youtube className="h-4 w-4" /> View YouTube playlist
                </a>
              ) : (
                <span className="flex items-center gap-2">
                  <Youtube className="h-4 w-4 text-primary" /> No playlist yet — created automatically with your first song
                </span>
              )}
              {unsyncedCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {unsyncedCount} song{unsyncedCount === 1 ? "" : "s"} not yet synced to YouTube
                </span>
              )}
              {syncMessage && <span className="text-xs text-muted-foreground">{syncMessage}</span>}
            </div>
            <Button size="sm" variant="outline" onClick={syncPlaylist} disabled={syncing}>
              <RefreshCw className="h-4 w-4" />
              {syncing ? "Syncing..." : "Sync to YouTube"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/40">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm text-muted-foreground">Now playing</CardTitle>
          <Button size="sm" variant="outline" onClick={advance}>
            <SkipForward className="h-4 w-4" />
            {snapshot.playing ? "Next song" : "Start"}
          </Button>
        </CardHeader>
        <CardContent>
          {snapshot.playing ? (
            <QueueItemRow item={snapshot.playing} />
          ) : (
            <p className="text-sm text-muted-foreground">Nothing playing — hit &quot;Start&quot; to begin.</p>
          )}
        </CardContent>
      </Card>

      {snapshot.pending && snapshot.pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending approval ({snapshot.pending.length})</CardTitle>
            <CardDescription>Review guest requests before they join the queue.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {snapshot.pending.map((item) => (
                <QueueItemRow
                  key={item.id}
                  item={item}
                  onApprove={() => act(item.id, "approve")}
                  onReject={() => act(item.id, "reject")}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Up next ({snapshot.approved.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {snapshot.approved.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nothing queued yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {snapshot.approved.map((item, i) => (
                <QueueItemRow
                  key={item.id}
                  item={item}
                  index={i}
                  onTogglePriority={() => act(item.id, item.isPriority ? "clearPriority" : "setPriority")}
                  onRemove={() => remove(item.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a song</CardTitle>
        </CardHeader>
        <CardContent>
          <SongSearchBox eventId={eventId} onAdded={refetch} />
        </CardContent>
      </Card>
    </div>
  );
}
