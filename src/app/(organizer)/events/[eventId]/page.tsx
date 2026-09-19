import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { hasEventPermission } from "@/server/permissions";
import { getEventPublicUrl } from "@/lib/qrcode";
import { formatInEventTimezone } from "@/lib/timezone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/event/copy-link-button";
import { DuplicateButton } from "@/components/event/duplicate-button";
import { DeleteEventButton } from "@/components/event/delete-event-button";
import {
  Calendar,
  MapPin,
  Users,
  ListMusic,
  Image as ImageIcon,
  Mic2,
  Tv,
  UserPlus,
  Pencil,
} from "lucide-react";

export default async function EventOverviewPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) redirect("/login");

  const allowed = await hasEventPermission(eventId, session.user.id, "manage_rsvps");
  if (!allowed) notFound();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { guests: true, queueItems: true } } },
  });
  if (!event) notFound();

  const isOrganizer = event.organizerId === session.user.id;
  const publicUrl = getEventPublicUrl(event.slug);

  const links = [
    { href: `/events/${event.id}/guests`, label: "Guests & RSVPs", icon: Users, desc: `${event._count.guests} guest${event._count.guests === 1 ? "" : "s"}` },
    { href: `/events/${event.id}/flyer`, label: "Flyer", icon: ImageIcon, desc: "Design & export" },
    { href: `/events/${event.id}/playlist`, label: "Song queue", icon: ListMusic, desc: `${event._count.queueItems} request${event._count.queueItems === 1 ? "" : "s"}` },
    { href: `/events/${event.id}/host`, label: "Host mode", icon: Mic2, desc: "Run the night live" },
    { href: `/events/${event.id}/tv?token=${event.tvDisplayToken}`, label: "TV display", icon: Tv, desc: "Projector view" },
    ...(isOrganizer ? [{ href: `/events/${event.id}/co-hosts`, label: "Co-hosts", icon: UserPlus, desc: "Invite & assign roles" }] : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="mb-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
            {event.status.toLowerCase()}
          </span>
          <h1 className="font-display text-2xl font-bold">{event.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatInEventTimezone(event.startsAt, event.timezone, "EEE, MMM d, yyyy · h:mm a zzz")}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {event.isVirtual ? "Virtual" : event.locationName ?? "Location TBD"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/events/${event.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DuplicateButton eventId={event.id} />
          {isOrganizer && <DeleteEventButton eventId={event.id} eventName={event.name} />}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Share your event</CardTitle>
          <CardDescription>One link for RSVPs, song requests, and the flyer&apos;s QR code.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/events/${event.id}/qrcode`}
            alt="Event QR code"
            width={120}
            height={120}
            className="rounded-md border border-border bg-white p-2"
          />
          <div className="flex flex-1 flex-col gap-2">
            <code className="break-all rounded-md bg-muted px-3 py-2 text-sm">{publicUrl}</code>
            <div className="flex gap-2">
              <CopyLinkButton url={publicUrl} />
              <Button asChild variant="outline" size="sm">
                <Link href={`/e/${event.slug}`} target="_blank">
                  View public page
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
        <CardContent className="flex flex-col gap-3 border-t border-border pt-4">
          {[
            "Share this link (or the QR code above) with your guests — text it, post it, or print it on the flyer.",
            "Guests open it, RSVP, and can then search for and request songs — no account needed.",
            "Approve requests as they come in (or turn on auto-approve in Edit), then run the night from Host mode.",
          ].map((step, i) => (
            <div key={step} className="flex items-start gap-3 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <p className="text-muted-foreground">{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardContent className="flex items-center gap-3 py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <link.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
