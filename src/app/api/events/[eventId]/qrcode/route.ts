import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { generateQrCodePngBuffer, getEventPublicUrl } from "@/lib/qrcode";

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await generateQrCodePngBuffer(getEventPublicUrl(event.slug));
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
