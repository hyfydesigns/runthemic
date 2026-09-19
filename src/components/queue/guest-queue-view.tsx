"use client";

import { useCallback, useEffect, useState } from "react";
import { RealtimeProvider, useEventRoom, useSocketEvent, usePollingRefetch } from "@/hooks/useRealtime";
import { SongSearchBox } from "@/components/queue/song-search-box";
import { QueueItemRow } from "@/components/queue/queue-item-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { QueueSnapshot } from "@/types/queue";

export function GuestQueueView({ eventId }: { eventId: string }) {
  return (
    <RealtimeProvider>
      <GuestQueueInner eventId={eventId} />
    </RealtimeProvider>
  );
}

function GuestQueueInner({ eventId }: { eventId: string }) {
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null);

  const refetch = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/playlist`);
    if (res.ok) setSnapshot(await res.json());
  }, [eventId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEventRoom(eventId, refetch);
  useSocketEvent("queue:update", () => refetch());
  useSocketEvent("nowplaying:change", () => refetch());
  usePollingRefetch(refetch);

  if (!snapshot) return <p className="text-sm text-muted-foreground">Loading queue...</p>;

  return (
    <div className="flex flex-col gap-6">
      {snapshot.playing && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Now playing</CardTitle>
          </CardHeader>
          <CardContent>
            <QueueItemRow item={snapshot.playing} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request a song</CardTitle>
        </CardHeader>
        <CardContent>
          <SongSearchBox eventId={eventId} onAdded={refetch} />
        </CardContent>
      </Card>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Up next ({snapshot.approved.length})</TabsTrigger>
          <TabsTrigger value="mine">My requests ({snapshot.mine.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="queue">
          <Card>
            <CardContent className="p-0">
              {snapshot.approved.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No songs queued yet — be the first!</p>
              ) : (
                <div className="divide-y divide-border">
                  {snapshot.approved.map((item, i) => (
                    <QueueItemRow key={item.id} item={item} index={i} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="mine">
          <Card>
            <CardContent className="p-0">
              {snapshot.mine.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">You haven&apos;t requested any songs yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {snapshot.mine.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 px-2">
                      <div className="min-w-0 flex-1">
                        <QueueItemRow item={item} />
                      </div>
                      <span className="mr-2 shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                        {item.status.toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
