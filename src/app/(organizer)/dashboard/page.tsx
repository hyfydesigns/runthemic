import Link from "next/link";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { formatInEventTimezone } from "@/lib/timezone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Plus, Calendar, MapPin, Users } from "lucide-react";

export default async function DashboardPage() {
  const session = await getOrganizerSession();
  const userId = session!.user.id;

  const events = await prisma.event.findMany({
    where: {
      OR: [{ organizerId: userId }, { members: { some: { userId } } }],
    },
    orderBy: { startsAt: "desc" },
    include: { _count: { select: { guests: true } } },
  });

  const now = new Date();
  const upcoming = events.filter((e) => e.startsAt >= now && e.status !== "CANCELLED");
  const past = events.filter((e) => e.startsAt < now || e.status === "CANCELLED");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Your events</h1>
          <p className="text-sm text-muted-foreground">Manage your karaoke nights.</p>
        </div>
        <Button asChild>
          <Link href="/events/new">
            <Plus className="h-4 w-4" />
            Create event
          </Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="font-display text-lg font-semibold">No events yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create your first karaoke night — you&apos;ll get a shareable link, QR code, and flyer in
              minutes.
            </p>
            <Button asChild className="mt-2">
              <Link href="/events/new">
                <Plus className="h-4 w-4" />
                Create your first event
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          {upcoming.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Upcoming
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Past</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
}: {
  event: {
    id: string;
    name: string;
    startsAt: Date;
    timezone: string;
    locationName: string | null;
    isVirtual: boolean;
    status: string;
    _count: { guests: number };
  };
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="line-clamp-1">{event.name}</CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {formatInEventTimezone(event.startsAt, event.timezone, "EEE, MMM d · h:mm a zzz")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {event.isVirtual ? "Virtual" : event.locationName ?? "Location TBD"}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {event._count.guests} RSVP{event._count.guests === 1 ? "" : "s"}
        </span>
        <span className="mt-1 inline-flex w-fit rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
          {event.status.toLowerCase()}
        </span>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/events/${event.id}`}>Manage</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
