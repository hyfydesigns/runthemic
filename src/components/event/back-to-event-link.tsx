import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackToEventLink({ eventId }: { eventId: string }) {
  return (
    <Link
      href={`/events/${eventId}`}
      className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" />
      Back to event
    </Link>
  );
}
