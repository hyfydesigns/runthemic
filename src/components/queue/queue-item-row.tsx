"use client";

import { Button } from "@/components/ui/button";
import { formatDuration, type QueueItemDTO } from "@/types/queue";
import { Check, X, Star, Trash2, Mic2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueueItemRowProps {
  item: QueueItemDTO;
  index?: number;
  onApprove?: () => void;
  onReject?: () => void;
  onTogglePriority?: () => void;
  onRemove?: () => void;
  compact?: boolean;
}

export function QueueItemRow({ item, index, onApprove, onReject, onTogglePriority, onRemove, compact }: QueueItemRowProps) {
  return (
    <div className={cn("flex items-center gap-3 p-2", item.status === "PLAYING" && "bg-primary/5")}>
      {typeof index === "number" && (
        <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{index + 1}</span>
      )}
      {item.status === "PLAYING" && <Mic2 className="h-4 w-4 shrink-0 text-primary" />}
      {item.thumbnailUrl && !compact && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.thumbnailUrl} alt="" className="h-10 w-14 shrink-0 rounded object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium">{item.youtubeVideoTitle}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.requestedBy ?? "Host"}
          {item.durationSeconds ? ` · ${formatDuration(item.durationSeconds)}` : ""}
          {item.isPriority ? " · Priority" : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {onApprove && (
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={onApprove} title="Approve">
            <Check className="h-4 w-4 text-emerald-500" />
          </Button>
        )}
        {onReject && (
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={onReject} title="Reject">
            <X className="h-4 w-4 text-destructive" />
          </Button>
        )}
        {onTogglePriority && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onTogglePriority}
            title="Toggle priority"
          >
            <Star className={cn("h-4 w-4", item.isPriority ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
          </Button>
        )}
        {onRemove && (
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={onRemove} title="Remove">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}
