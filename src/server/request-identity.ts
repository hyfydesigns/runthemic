import { getOrganizerSession } from "@/server/auth";
import { getGuestSession } from "@/server/guest-session";
import { hasEventPermission, type EventAction } from "@/server/permissions";

export interface RequestIdentity {
  kind: "organizer" | "guest";
  userId?: string;
  guestSessionId?: string;
  displayName: string;
}

/**
 * Resolves whoever is calling a guest-or-organizer-facing route: an
 * authenticated organizer/co-host with the given permission, or a guest
 * holding a valid session cookie for this event. Returns null if neither.
 */
export async function resolveEventRequester(
  eventId: string,
  requiredOrganizerAction: EventAction,
): Promise<RequestIdentity | null> {
  const session = await getOrganizerSession();
  if (session) {
    const allowed = await hasEventPermission(eventId, session.user.id, requiredOrganizerAction);
    if (allowed) {
      return { kind: "organizer", userId: session.user.id, displayName: session.user.name ?? "Host" };
    }
  }

  const guestSession = await getGuestSession(eventId);
  if (guestSession) {
    return { kind: "guest", guestSessionId: guestSession.id, displayName: guestSession.displayName };
  }

  return null;
}
