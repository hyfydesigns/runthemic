import { prisma } from "@/server/db";
import { sendEmail } from "@/server/email/send";
import { rsvpConfirmationHtml, organizerNewRsvpHtml } from "@/server/email/templates";
import { getEventPublicUrl } from "@/lib/qrcode";
import { formatInEventTimezone } from "@/lib/timezone";
import type { GuestSession } from "@prisma/client";

function baseUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Sends the guest's own RSVP confirmation (if they gave an email) and, for a
 * brand-new RSVP only, notifies the organizer — gated on their
 * NotificationPref (defaults to on, matching the schema default, when no
 * pref row exists yet).
 */
export async function notifyRsvp(eventId: string, guestSession: GuestSession, isNewRsvp: boolean) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: { select: { name: true, email: true, id: true } } },
  });
  if (!event) return;

  const whenLabel = formatInEventTimezone(event.startsAt, event.timezone, "EEEE, MMMM d · h:mm a zzz");
  const whereLabel = event.isVirtual ? (event.virtualLink ?? "Virtual event") : (event.locationName ?? "Location TBD");
  const eventUrl = getEventPublicUrl(event.slug);

  if (guestSession.email) {
    await sendEmail({
      to: guestSession.email,
      subject: `You're confirmed for ${event.name}`,
      html: rsvpConfirmationHtml({
        guestName: guestSession.displayName,
        eventName: event.name,
        whenLabel,
        whereLabel,
        eventUrl,
        queueUrl: `${eventUrl}/queue`,
        rsvpStatus: guestSession.rsvpStatus,
      }),
    });
  }

  if (isNewRsvp && event.organizer.email) {
    const pref = await prisma.notificationPref.findUnique({ where: { userId: event.organizer.id } });
    const wantsEmail = pref?.emailOnNewRsvp ?? true; // schema default is true when no row exists yet
    if (wantsEmail) {
      await sendEmail({
        to: event.organizer.email,
        subject: `${guestSession.displayName} RSVP'd to ${event.name}`,
        html: organizerNewRsvpHtml({
          organizerName: event.organizer.name ?? "there",
          guestName: guestSession.displayName,
          eventName: event.name,
          rsvpStatus: guestSession.rsvpStatus,
          guestsUrl: `${baseUrl()}/events/${event.id}/guests`,
        }),
      });
    }
  }
}
