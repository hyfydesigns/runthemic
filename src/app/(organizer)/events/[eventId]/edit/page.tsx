import { notFound, redirect } from "next/navigation";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { hasEventPermission } from "@/server/permissions";
import { toZonedInputValue } from "@/lib/timezone";
import { EventForm, type EventFormValues } from "@/components/wizard/event-form";

// Renders the stored UTC instant back into a wall-clock value in the
// event's own timezone — using the server's local offset here (as this
// used to) would silently shift the time whenever the server and the
// event's timezone differ.
function toLocalInputValue(date: Date | null, timezone: string): string {
  if (!date) return "";
  return toZonedInputValue(date, timezone);
}

export default async function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) redirect("/login");

  const allowed = await hasEventPermission(eventId, session.user.id, "full_edit");
  if (!allowed) redirect(`/events/${eventId}`);

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  const initialValues: Partial<EventFormValues> = {
    name: event.name,
    description: event.description ?? "",
    startsAt: toLocalInputValue(event.startsAt, event.timezone),
    endsAt: toLocalInputValue(event.endsAt, event.timezone),
    timezone: event.timezone,
    isVirtual: event.isVirtual,
    locationName: event.locationName ?? "",
    locationAddress: event.locationAddress ?? "",
    virtualLink: event.virtualLink ?? "",
    capacity: event.capacity?.toString() ?? "",
    privacy: event.privacy,
    coverImageUrl: event.coverImageUrl ?? "",
    themeColor: event.themeColor ?? "#ff2fb0",
    ticketPriceCents: event.ticketPriceCents != null ? (event.ticketPriceCents / 100).toString() : "",
    donationLinkUrl: event.donationLinkUrl ?? "",
    dressCode: event.dressCode ?? "",
    ageRestriction: event.ageRestriction ?? "",
    byobNotes: event.byobNotes ?? "",
    autoApproveRequests: event.autoApproveRequests,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-bold">Edit event</h1>
      <EventForm mode="edit" eventId={event.id} initialValues={initialValues} />
    </div>
  );
}
