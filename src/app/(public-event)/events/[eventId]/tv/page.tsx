import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { TvDisplay } from "@/components/queue/tv-display";

export default async function TvDisplayPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { eventId } = await params;
  const { token } = await searchParams;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || !token || token !== event.tvDisplayToken) notFound();

  return <TvDisplay eventId={event.id} eventName={event.name} qrCodeUrl={`/api/events/${event.id}/qrcode`} />;
}
