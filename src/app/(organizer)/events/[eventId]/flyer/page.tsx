import { notFound, redirect } from "next/navigation";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { hasEventPermission } from "@/server/permissions";
import { getEventPublicUrl } from "@/lib/qrcode";
import { FlyerEditor } from "@/components/flyer/flyer-editor";

export default async function FlyerPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) redirect("/login");

  const allowed = await hasEventPermission(eventId, session.user.id, "full_edit");
  if (!allowed) notFound();

  const [event, flyerConfig] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.flyerConfig.findUnique({ where: { eventId } }),
  ]);
  if (!event) notFound();

  const overrides =
    (flyerConfig?.fieldOverrides as
      | { titleOverride?: string; subtitleOverride?: string; customBackgroundUrl?: string }
      | null) ?? {};

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Flyer</h1>
        <p className="text-sm text-muted-foreground">
          Auto-updates with your event details — edit the event to change them everywhere.
        </p>
      </div>
      <FlyerEditor
        eventId={event.id}
        eventName={event.name}
        startsAt={event.startsAt.toISOString()}
        timezone={event.timezone}
        locationLabel={event.isVirtual ? "Virtual event" : (event.locationName ?? "Location TBD")}
        qrCodeUrl={`/api/events/${event.id}/qrcode`}
        initialTemplateKey={flyerConfig?.templateKey ?? "NEON"}
        initialTitleOverride={overrides.titleOverride ?? ""}
        initialSubtitleOverride={overrides.subtitleOverride ?? ""}
        initialCustomBackgroundUrl={overrides.customBackgroundUrl ?? ""}
      />
      <p className="text-xs text-muted-foreground">
        Share link: <code>{getEventPublicUrl(event.slug)}</code>
      </p>
    </div>
  );
}
