import { notFound, redirect } from "next/navigation";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { CoHostsPanel } from "@/components/event/co-hosts-panel";

export default async function CoHostsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) redirect("/login");

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.organizerId !== session.user.id) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Co-hosts</h1>
        <p className="text-sm text-muted-foreground">{event.name}</p>
      </div>
      <CoHostsPanel eventId={event.id} />
    </div>
  );
}
