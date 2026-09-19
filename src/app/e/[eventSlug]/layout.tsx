import { notFound } from "next/navigation";
import Link from "next/link";
import { getEventBySlug } from "@/server/events";

export default async function PublicEventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border px-4 py-4">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-gradient-neon">
          RunTheMic
        </Link>
      </header>
      <main className="mx-auto max-w-lg px-4 py-8">{children}</main>
    </div>
  );
}
