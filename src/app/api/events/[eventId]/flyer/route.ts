import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { hasEventPermission } from "@/server/permissions";
import { FLYER_TEMPLATES } from "@/server/flyer/templates";

const flyerUpdateSchema = z.object({
  templateKey: z.enum(Object.keys(FLYER_TEMPLATES) as [string, ...string[]]),
  fieldOverrides: z.object({
    titleOverride: z.string().max(120).optional(),
    subtitleOverride: z.string().max(160).optional(),
    customBackgroundUrl: z
      .string()
      .max(3_000_000, "Image is too large")
      .refine((v) => v === "" || v.startsWith("data:image/"), "Must be an image")
      .optional(),
  }),
});

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await hasEventPermission(eventId, session.user.id, "full_edit");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const config = await prisma.flyerConfig.findUnique({ where: { eventId } });
  return NextResponse.json({ flyerConfig: config ?? { templateKey: "NEON", fieldOverrides: {} } });
}

export async function PUT(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await hasEventPermission(eventId, session.user.id, "full_edit");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = flyerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const config = await prisma.flyerConfig.upsert({
    where: { eventId },
    create: {
      eventId,
      templateKey: parsed.data.templateKey as never,
      fieldOverrides: parsed.data.fieldOverrides,
    },
    update: {
      templateKey: parsed.data.templateKey as never,
      fieldOverrides: parsed.data.fieldOverrides,
    },
  });

  return NextResponse.json({ flyerConfig: config });
}
