import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/server/events";
import { getGuestSession } from "@/server/guest-session";
import { GuestQueueView } from "@/components/queue/guest-queue-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StepList } from "@/components/ui/step-list";

export default async function GuestQueuePage({ params }: { params: Promise<{ eventSlug: string }> }) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  const guestSession = await getGuestSession(event.id);

  if (!guestSession) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-muted-foreground">RSVP first to request songs and see the live queue.</p>
          <Button asChild>
            <Link href={`/e/${event.slug}/rsvp`}>RSVP now</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Song queue</h1>
        <p className="text-sm text-muted-foreground">{event.name}</p>
      </div>

      <Card>
        <CardContent className="py-4">
          <StepList
            steps={[
              "Search for a song below and tap it to add your request.",
              "Watch \"Up next\" for the live queue, or \"My requests\" to track your own.",
              "The host approves requests (or they're auto-approved) — \"Now playing\" updates live as the night runs.",
            ]}
          />
        </CardContent>
      </Card>

      <GuestQueueView eventId={event.id} />
    </div>
  );
}
