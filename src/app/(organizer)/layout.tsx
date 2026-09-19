import { redirect } from "next/navigation";
import { getOrganizerSession } from "@/server/auth";
import { OrganizerNav } from "@/components/layout/organizer-nav";

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const session = await getOrganizerSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-dvh pb-14 sm:pb-0">
      <OrganizerNav />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
