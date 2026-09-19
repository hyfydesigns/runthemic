import { prisma } from "@/server/db";
import type { EventMemberRole } from "@prisma/client";

export type EventAction = "manage_songs" | "manage_rsvps" | "full_edit";

const ROLE_ACTIONS: Record<EventMemberRole, EventAction[]> = {
  ORGANIZER: ["manage_songs", "manage_rsvps", "full_edit"],
  COHOST_FULL: ["manage_songs", "manage_rsvps", "full_edit"],
  COHOST_SONGS: ["manage_songs"],
  COHOST_RSVPS: ["manage_rsvps"],
};

/**
 * Returns true if the given user may perform `action` on the event, whether
 * they're the organizer (owner) or a co-host with a role that grants it.
 */
export async function hasEventPermission(
  eventId: string,
  userId: string,
  action: EventAction,
): Promise<boolean> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true },
  });
  if (!event) return false;
  if (event.organizerId === userId) return true;

  const member = await prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  if (!member) return false;

  return ROLE_ACTIONS[member.role].includes(action);
}

export async function requireEventPermission(
  eventId: string,
  userId: string,
  action: EventAction,
): Promise<void> {
  const allowed = await hasEventPermission(eventId, userId, action);
  if (!allowed) {
    throw new PermissionError(`User ${userId} lacks '${action}' permission on event ${eventId}`);
  }
}

export class PermissionError extends Error {}
