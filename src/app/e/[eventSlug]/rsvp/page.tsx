import { notFound } from "next/navigation";
import { getEventBySlug } from "@/server/events";
import { getGuestSession } from "@/server/guest-session";
import { RsvpForm } from "@/components/rsvp/rsvp-form";
import { Card, CardContent } from "@/components/ui/card";
import { StepList } from "@/components/ui/step-list";

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

      {!guestSession && (
        <Card>
          <CardContent className="py-4">
            <StepList
              steps={[
                "Enter your name so the host knows who's coming.",
                "Pick Going, Maybe, or Can't go, and add a note if you like.",
                "Confirm — then tap \"Song queue\" on the event page to search for and request songs.",
              ]}
            />
          </CardContent>
        </Card>
      )}

      <RsvpForm
        eventId={event.id}
        eventSlug={event.slug}
        initialValues={
          guestSession && guestSession.rsvpStatus !== "WAITLISTED"
            ? {
                displayName: guestSession.displayName,
                email: guestSession.email ?? "",
                note: guestSession.note ?? "",
                rsvpStatus: guestSession.rsvpStatus as "GOING" | "MAYBE" | "CANT_GO",
              }
            : guestSession
              ? {
                  displayName: guestSession.displayName,
                  email: guestSession.email ?? "",
                  note: guestSession.note ?? "",
                  rsvpStatus: "GOING",
                }
              : undefined
        }
      />
    </div>
  );
}
