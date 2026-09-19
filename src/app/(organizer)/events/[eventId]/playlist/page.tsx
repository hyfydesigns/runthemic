import { notFound, redirect } from "next/navigation";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { hasEventPermission } from "@/server/permissions";
import { isYoutubeConfigured } from "@/server/youtube/client";
import { OrganizerPlaylistView } from "@/components/queue/organizer-playlist-view";
import { BackToEventLink } from "@/components/event/back-to-event-link";

export default async function EventPlaylistPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) redirect("/login");

  const allowed = await hasEventPermission(eventId, session.user.id, "manage_songs");
  if (!allowed) notFound();

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <BackToEventLink eventId={event.id} />
        <div>
          <h1 className="font-display text-2xl font-bold">Song queue</h1>
          <p className="text-sm text-muted-foreground">{event.name}</p>
        </div>
      </div>
      <OrganizerPlaylistView eventId={event.id} youtubeConfigured={isYoutubeConfigured()} />
    </div>
  );
}
