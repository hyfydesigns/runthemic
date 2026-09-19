import { NextResponse } from "next/server";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";

export async function POST() {
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.youtubeConnection.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
