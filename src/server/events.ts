import { cache } from "react";
import { prisma } from "@/server/db";
import { generateEventSlug } from "@/lib/slug";
import { zonedWallTimeToUtc } from "@/lib/timezone";
import type { EventInput } from "@/lib/validation/event";
import type { Prisma } from "@prisma/client";

// Memoized per-request so the layout and page for /e/[slug] can both call
// this without issuing duplicate queries.
export const getEventBySlug = cache((slug: string) => {
  return prisma.event.findUnique({ where: { slug } });
});

function toEventFields(input: EventInput) {
  return {
    name: input.name,
    description: input.description || null,
    startsAt: zonedWallTimeToUtc(input.startsAt, input.timezone),
    endsAt: input.endsAt ? zonedWallTimeToUtc(input.endsAt, input.timezone) : null,
    timezone: input.timezone,
    isVirtual: input.isVirtual,
    locationName: input.locationName || null,
    locationAddress: input.locationAddress || null,
    virtualLink: input.virtualLink || null,
    capacity: input.capacity ?? null,
    privacy: input.privacy,
    coverImageUrl: input.coverImageUrl || null,
    themeColor: input.themeColor || null,
    ticketPriceCents: input.ticketPriceCents ?? null,
    donationLinkUrl: input.donationLinkUrl || null,
    dressCode: input.dressCode || null,
    ageRestriction: input.ageRestriction || null,
    byobNotes: input.byobNotes || null,
    autoApproveRequests: input.autoApproveRequests,
  } satisfies Partial<Prisma.EventUncheckedCreateInput>;
}

export async function createEvent(organizerId: string, input: EventInput) {
  const slug = generateEventSlug(input.name);
  return prisma.event.create({
    data: {
      ...toEventFields(input),
      slug,
      organizerId,
      status: "PUBLISHED",
    },
  });
}

export async function updateEvent(eventId: string, input: EventInput) {
  return prisma.event.update({
    where: { id: eventId },
    data: toEventFields(input),
  });
}

export async function duplicateEvent(eventId: string, organizerId: string) {
  const original = await prisma.event.findUnique({ where: { id: eventId } });
  if (!original) throw new Error("Event not found");

  const slug = generateEventSlug(`${original.name} copy`);
  return prisma.event.create({
    data: {
      organizerId,
      slug,
      name: `${original.name} (copy)`,
      description: original.description,
      startsAt: original.startsAt,
      endsAt: original.endsAt,
      timezone: original.timezone,
      isVirtual: original.isVirtual,
      locationName: original.locationName,
      locationAddress: original.locationAddress,
      virtualLink: original.virtualLink,
      capacity: original.capacity,
      privacy: original.privacy,
      coverImageUrl: original.coverImageUrl,
      themeColor: original.themeColor,
      ticketPriceCents: original.ticketPriceCents,
      donationLinkUrl: original.donationLinkUrl,
      dressCode: original.dressCode,
      ageRestriction: original.ageRestriction,
      byobNotes: original.byobNotes,
      autoApproveRequests: original.autoApproveRequests,
      status: "DRAFT",
      duplicatedFromId: original.id,
    },
  });
}
