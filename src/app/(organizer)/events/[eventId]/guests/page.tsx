import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { hasEventPermission } from "@/server/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { RSVP_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  GOING: "bg-emerald-500/15 text-emerald-400",
  MAYBE: "bg-amber-500/15 text-amber-400",
  CANT_GO: "bg-muted text-muted-foreground",
  WAITLISTED: "bg-neon-purple/15 text-neon-purple",
};

export default async function EventGuestsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) redirect("/login");

  const allowed = await hasEventPermission(eventId, session.user.id, "manage_rsvps");
  if (!allowed) notFound();

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  const guests = await prisma.guestSession.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
  });

  const going = guests.filter((g) => g.rsvpStatus === "GOING");
  const maybe = guests.filter((g) => g.rsvpStatus === "MAYBE");
  const cantGo = guests.filter((g) => g.rsvpStatus === "CANT_GO");
  const waitlisted = guests.filter((g) => g.rsvpStatus === "WAITLISTED");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Guests</h1>
        <p className="text-sm text-muted-foreground">{event.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Going" value={going.length} />
        <StatTile label="Maybe" value={maybe.length} />
        <StatTile label="Can't go" value={cantGo.length} />
        <StatTile label="Waitlisted" value={waitlisted.length} />
      </div>

      {guests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No RSVPs yet. Share your event link to get the party started.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {guests.map((guest) => (
                <div key={guest.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{guest.displayName}</p>
                    {guest.note && <p className="truncate text-xs text-muted-foreground">{guest.note}</p>}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                      STATUS_STYLES[guest.rsvpStatus] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {RSVP_STATUS_LABELS[guest.rsvpStatus] ?? guest.rsvpStatus}
                  </span>
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                    {format(guest.createdAt, "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4 text-center">
        <p className="font-display text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
