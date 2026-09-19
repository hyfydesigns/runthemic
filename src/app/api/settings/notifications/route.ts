import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";

export async function GET() {
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pref = await prisma.notificationPref.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({
    emailOnNewRsvp: pref?.emailOnNewRsvp ?? true,
    emailOnSongRequest: pref?.emailOnSongRequest ?? false,
  });
}

const schema = z.object({ emailOnNewRsvp: z.boolean() });

export async function PATCH(req: Request) {
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const pref = await prisma.notificationPref.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, emailOnNewRsvp: parsed.data.emailOnNewRsvp },
    update: { emailOnNewRsvp: parsed.data.emailOnNewRsvp },
  });

  return NextResponse.json({ emailOnNewRsvp: pref.emailOnNewRsvp });
}
