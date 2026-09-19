import { z } from "zod";
import { isValidTimezone } from "@/lib/timezone";

export const eventPrivacyValues = ["PUBLIC", "PRIVATE", "LINK_ONLY"] as const;
export const ageRestrictionValues = ["all-ages", "18+", "21+"] as const;

export const eventInputSchema = z
  .object({
    name: z.string().trim().min(1, "Event name is required").max(120),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    startsAt: z.string().min(1, "Start date/time is required"),
    endsAt: z.string().optional().or(z.literal("")),
    timezone: z.string().min(1, "Timezone is required").refine(isValidTimezone, "Enter a valid IANA timezone"),
    isVirtual: z.boolean().default(false),
    locationName: z.string().trim().max(200).optional().or(z.literal("")),
    locationAddress: z.string().trim().max(300).optional().or(z.literal("")),
    virtualLink: z.string().trim().max(500).optional().or(z.literal("")),
    capacity: z.coerce.number().int().positive().max(100000).optional().nullable(),
    privacy: z.enum(eventPrivacyValues).default("LINK_ONLY"),
    coverImageUrl: z.string().trim().max(1000).optional().or(z.literal("")),
    themeColor: z.string().trim().max(20).optional().or(z.literal("")),
    ticketPriceCents: z.coerce.number().int().min(0).max(100_000_00).optional().nullable(),
    donationLinkUrl: z.string().trim().max(500).optional().or(z.literal("")),
    dressCode: z.string().trim().max(200).optional().or(z.literal("")),
    ageRestriction: z.string().trim().max(20).optional().or(z.literal("")),
    byobNotes: z.string().trim().max(1000).optional().or(z.literal("")),
    autoApproveRequests: z.boolean().default(false),
  })
  .refine((data) => !Number.isNaN(Date.parse(data.startsAt)), {
    message: "Enter a valid start date/time",
    path: ["startsAt"],
  });

export type EventInput = z.infer<typeof eventInputSchema>;

export const rsvpSchema = z.object({
  displayName: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email().optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  rsvpStatus: z.enum(["GOING", "MAYBE", "CANT_GO"]).default("GOING"),
  turnstileToken: z.string().nullable().optional(),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;
