"use client";

import { useCallback, useEffect, useState } from "react";
import { RealtimeProvider, useEventRoom, useSocketEvent, usePollingRefetch } from "@/hooks/useRealtime";
import { formatDuration, type QueueSnapshot } from "@/types/queue";
import { Mic2 } from "lucide-react";

interface TvDisplayProps {
  eventId: string;
  eventName: string;
  qrCodeUrl: string;
}

export function TvDisplay({ eventId, eventName, qrCodeUrl }: TvDisplayProps) {
  return (
    <RealtimeProvider>
      <TvDisplayInner eventId={eventId} eventName={eventName} qrCodeUrl={qrCodeUrl} />
    </RealtimeProvider>
  );
}

function TvDisplayInner({ eventId, eventName, qrCodeUrl }: TvDisplayProps) {
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

  const nextUp = snapshot?.approved.slice(0, 3) ?? [];

  return (
    <div className="flex min-h-dvh flex-col justify-between p-10">
      <header className="flex items-center justify-between">
        <span className="font-display text-2xl font-bold tracking-tight text-gradient-neon">RunTheMic</span>
        <span className="text-xl text-muted-foreground">{eventName}</span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <Mic2 className="h-16 w-16 text-primary" />
        {snapshot?.playing ? (
          <>
            <p className="text-lg uppercase tracking-widest text-muted-foreground">Now playing</p>
            <h1 className="font-display text-6xl font-bold">{snapshot.playing.youtubeVideoTitle}</h1>
            <p className="text-2xl text-muted-foreground">
              {snapshot.playing.requestedBy ?? "Host"}
              {snapshot.playing.durationSeconds ? ` · ${formatDuration(snapshot.playing.durationSeconds)}` : ""}
            </p>
          </>
        ) : (
          <h1 className="font-display text-5xl font-bold text-muted-foreground">Get ready to sing!</h1>
        )}
      </main>

      <footer className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-lg uppercase tracking-widest text-muted-foreground">Up next</p>
          {nextUp.length === 0 ? (
            <p className="text-xl text-muted-foreground">Queue is open — add a song!</p>
          ) : (
            <ol className="flex flex-col gap-1 text-2xl">
              {nextUp.map((item, i) => (
                <li key={item.id}>
                  {i + 1}. {item.youtubeVideoTitle}
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCodeUrl} alt="Scan to join" width={140} height={140} className="rounded-md bg-white p-2" />
          <p className="text-sm text-muted-foreground">Scan to RSVP &amp; request songs</p>
        </div>
      </footer>
    </div>
  );
}
