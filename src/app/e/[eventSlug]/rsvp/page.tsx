import { notFound } from "next/navigation";
import { getEventBySlug } from "@/server/events";
import { getGuestSession } from "@/server/guest-session";
import { RsvpForm } from "@/components/rsvp/rsvp-form";

export default async function RsvpPage({ params }: { params: Promise<{ eventSlug: string }> }) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  const guestSession = await getGuestSession(event.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">RSVP</h1>
        <p className="text-sm text-muted-foreground">{event.name}</p>
      </div>
      <RsvpForm
        eventId={event.id}
        eventSlug={event.slug}
        initialValues={
          guestSession && guestSession.rsvpStatus !== "WAITLISTED"
            ? {
                displayName: guestSession.displayName,
                note: guestSession.note ?? "",
                rsvpStatus: guestSession.rsvpStatus as "GOING" | "MAYBE" | "CANT_GO",
              }
            : guestSession
              ? { displayName: guestSession.displayName, note: guestSession.note ?? "", rsvpStatus: "GOING" }
              : undefined
        }
      />
    </div>
  );
}
