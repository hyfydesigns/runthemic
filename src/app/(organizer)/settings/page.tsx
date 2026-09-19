import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Youtube, User } from "lucide-react";

export default async function SettingsPage() {
  const session = await getOrganizerSession();
  if (!session) redirect("/login");

  const [user, youtubeConnection] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.youtubeConnection.findUnique({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <User className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>{user?.name ?? "—"} · {user?.email}</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Link href="/settings/youtube">
        <Card className="transition-colors hover:border-primary/50">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Youtube className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">YouTube</CardTitle>
              <CardDescription>
                {youtubeConnection?.isValid
                  ? `Connected as ${youtubeConnection.googleAccountEmail}`
                  : "Not connected"}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </Link>
    </div>
  );
}
