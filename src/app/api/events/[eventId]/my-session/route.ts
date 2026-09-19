import { NextResponse } from "next/server";
import { getGuestSession } from "@/server/guest-session";

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const guestSession = await getGuestSession(eventId);
  return NextResponse.json({ guestSession });
}
