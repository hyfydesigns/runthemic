import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Ticket, Shirt, Info } from "lucide-react";
import { getEventBySlug } from "@/server/events";
import { getGuestSession } from "@/server/guest-session";
import { formatInEventTimezone } from "@/lib/timezone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RSVP_STATUS_LABELS } from "@/lib/constants";

export default async function PublicEventPage({ params }: { params: Promise<{ eventSlug: string }> }) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  const guestSession = await getGuestSession(event.id);

  return (
    <div className="flex flex-col gap-6">
      {event.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.coverImageUrl} alt="" className="aspect-video w-full rounded-lg object-cover" />
      )}

      <div>
        <h1 className="font-display text-3xl font-bold">{event.name}</h1>
        <div className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatInEventTimezone(event.startsAt, event.timezone, "EEEE, MMMM d, yyyy · h:mm a zzz")}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {event.isVirtual ? event.virtualLink || "Virtual event" : event.locationName ?? "Location TBD"}
          </span>
          {event.ticketPriceCents != null && (
            <span className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              {event.ticketPriceCents === 0 ? "Free" : `$${(event.ticketPriceCents / 100).toFixed(2)}`}
            </span>
          )}
          {event.dressCode && (
            <span className="flex items-center gap-2">
              <Shirt className="h-4 w-4" />
              {event.dressCode}
            </span>
          )}
          {(event.ageRestriction || event.byobNotes) && (
            <span className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              {[event.ageRestriction, event.byobNotes].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
      </div>

      {event.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{event.description}</p>}

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
          {guestSession ? (
            <>
              <p className="text-sm text-muted-foreground">
                You&apos;re marked as{" "}
                <span className="font-semibold text-foreground">
                  {RSVP_STATUS_LABELS[guestSession.rsvpStatus] ?? guestSession.rsvpStatus}
                </span>
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href={`/e/${event.slug}/rsvp`}>Change RSVP</Link>
                </Button>
                <Button asChild>
                  <Link href={`/e/${event.slug}/queue`}>Song queue</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">RSVP to get access to the song queue.</p>
              <Button asChild size="lg">
                <Link href={`/e/${event.slug}/rsvp`}>RSVP now</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
