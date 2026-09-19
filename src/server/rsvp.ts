import { prisma } from "@/server/db";
import type { RsvpInput } from "@/lib/validation/event";
import { emitToEvent } from "@/server/socket";

export interface RsvpCounts {
  goingCount: number;
  maybeCount: number;
  cantGoCount: number;
  waitlistCount: number;
}

export async function getRsvpCounts(eventId: string): Promise<RsvpCounts> {
  const grouped = await prisma.guestSession.groupBy({
    by: ["rsvpStatus", "waitlisted"],
    where: { eventId },
    _count: true,
  });

  const counts: RsvpCounts = { goingCount: 0, maybeCount: 0, cantGoCount: 0, waitlistCount: 0 };
  for (const row of grouped) {
    if (row.waitlisted) {
      counts.waitlistCount += row._count;
      continue;
    }
    if (row.rsvpStatus === "GOING") counts.goingCount += row._count;
    else if (row.rsvpStatus === "MAYBE") counts.maybeCount += row._count;
    else if (row.rsvpStatus === "CANT_GO") counts.cantGoCount += row._count;
  }
  return counts;
}

/**
 * Creates (or updates, if this browser already holds a guest session for
 * this event) an RSVP. Applies capacity/waitlist logic: once the event's
 * capacity of confirmed "GOING" guests is reached, further GOING RSVPs are
 * flagged waitlisted rather than rejected outright.
 */
export async function submitRsvp(
  eventId: string,
  input: RsvpInput,
  existingGuestSessionId?: string | null,
) {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });

  let waitlisted = false;
  if (input.rsvpStatus === "GOING" && event.capacity != null) {
    const goingCount = await prisma.guestSession.count({
      where: {
        eventId,
        rsvpStatus: "GOING",
        waitlisted: false,
        ...(existingGuestSessionId ? { id: { not: existingGuestSessionId } } : {}),
      },
    });
    waitlisted = goingCount >= event.capacity;
  }

  const data = {
    displayName: input.displayName,
    email: input.email || null,
    note: input.note || null,
    rsvpStatus: waitlisted ? ("WAITLISTED" as const) : input.rsvpStatus,
    waitlisted,
  };

  const guestSession = existingGuestSessionId
    ? await prisma.guestSession.update({ where: { id: existingGuestSessionId }, data })
    : await prisma.guestSession.create({ data: { ...data, eventId } });

  const counts = await getRsvpCounts(eventId);
  emitToEvent(eventId, "rsvp:update", { eventId, ...counts });

  return { guestSession, waitlisted };
}
