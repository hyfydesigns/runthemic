import { notFound, redirect } from "next/navigation";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { hasEventPermission } from "@/server/permissions";
import { HostController } from "@/components/queue/host-controller";

export default async function HostModePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) redirect("/login");

  const allowed = await hasEventPermission(eventId, session.user.id, "manage_songs");
  if (!allowed) notFound();

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Host mode</h1>
        <p className="text-sm text-muted-foreground">{event.name}</p>
      </div>
      <HostController eventId={event.id} />
    </div>
  );
}
