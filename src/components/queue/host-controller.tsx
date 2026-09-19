"use client";

import { useCallback, useEffect, useState } from "react";
import { RealtimeProvider, useEventRoom, useSocketEvent, useRealtimeStatus, usePollingRefetch } from "@/hooks/useRealtime";
import { QueueItemRow } from "@/components/queue/queue-item-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkipForward, Mic2, Wifi, WifiOff } from "lucide-react";
import { formatDuration, type QueueSnapshot } from "@/types/queue";

export function HostController({ eventId }: { eventId: string }) {
  return (
    <RealtimeProvider>
      <HostControllerInner eventId={eventId} />
    </RealtimeProvider>
  );
}

function HostControllerInner({ eventId }: { eventId: string }) {
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null);
  const { connected } = useRealtimeStatus();

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

  async function advance() {
    await fetch(`/api/events/${eventId}/playlist/advance`, { method: "POST" });
    refetch();
  }

  if (!snapshot) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const nextUp = snapshot.approved.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
        {connected ? <Wifi className="h-3.5 w-3.5 text-emerald-500" /> : <WifiOff className="h-3.5 w-3.5" />}
        {connected ? "Live" : "Connecting..."}
      </div>

      <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <Mic2 className="h-8 w-8 text-primary" />
          {snapshot.playing ? (
            <>
              <p className="font-display text-3xl font-bold">{snapshot.playing.youtubeVideoTitle}</p>
              <p className="text-muted-foreground">
                Requested by {snapshot.playing.requestedBy ?? "Host"}
                {snapshot.playing.durationSeconds ? ` · ${formatDuration(snapshot.playing.durationSeconds)}` : ""}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">Nothing playing yet</p>
          )}
          <Button size="lg" onClick={advance}>
            <SkipForward className="h-5 w-5" />
            {snapshot.playing ? "Next song" : "Start the show"}
          </Button>
        </CardContent>
      </Card>

      {snapshot.pending && snapshot.pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requests to approve ({snapshot.pending.length})</CardTitle>
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
          <CardTitle className="text-base">Next up</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {nextUp.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Queue is empty.</p>
          ) : (
            <div className="divide-y divide-border">
              {nextUp.map((item, i) => (
                <QueueItemRow key={item.id} item={item} index={i} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
