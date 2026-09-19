"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Loader2 } from "lucide-react";
import { formatDuration, type SearchResultDTO } from "@/types/queue";

interface SongSearchBoxProps {
  eventId: string;
  onAdded?: () => void;
}

export function SongSearchBox({ eventId, onAdded }: SongSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/events/${eventId}/playlist/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setError(data.error ?? null);
      setLoading(false);
    }, 400);
    return () => clearTimeout(handle);
  }, [query, eventId]);

  async function addSong(result: SearchResultDTO) {
    setAddingId(result.videoId);
    const res = await fetch(`/api/events/${eventId}/playlist/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        youtubeVideoId: result.videoId,
        youtubeVideoTitle: result.title,
        youtubeChannelTitle: result.channelTitle,
        thumbnailUrl: result.thumbnailUrl ?? undefined,
        durationSeconds: result.durationSeconds ?? undefined,
      }),
    });
    setAddingId(null);
    if (res.ok) {
      onAdded?.();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a karaoke track..."
          className="pl-9"
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Searching...
        </div>
      )}

      {error && <p className="text-sm text-muted-foreground">{error}</p>}

      {results.length > 0 && (
        <div className="flex flex-col divide-y divide-border rounded-md border border-border">
          {results.map((r) => (
            <div key={r.videoId} className="flex items-center gap-3 p-2">
              {r.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.thumbnailUrl} alt="" className="h-12 w-16 shrink-0 rounded object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.channelTitle}
                  {r.durationSeconds ? ` · ${formatDuration(r.durationSeconds)}` : ""}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addSong(r)}
                disabled={addingId === r.videoId}
              >
                {addingId === r.videoId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
