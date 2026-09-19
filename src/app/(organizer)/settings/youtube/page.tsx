import { redirect } from "next/navigation";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { isYoutubeConfigured } from "@/server/youtube/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { YoutubeConnectPanel } from "@/components/settings/youtube-connect-panel";

export default async function YoutubeSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const session = await getOrganizerSession();
  if (!session) redirect("/login");

  const { connected, error } = await searchParams;
  const connection = await prisma.youtubeConnection.findUnique({ where: { userId: session.user.id } });
  const configured = isYoutubeConfigured();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">YouTube</h1>
        <p className="text-sm text-muted-foreground">
          Connect the YouTube account that will own your event playlists. This is separate from logging in
          with Google — connecting here grants playlist-management access only.
        </p>
      </div>

      {!configured && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-4 text-sm text-amber-500">
            YouTube integration isn&apos;t configured on this deployment yet (missing Google OAuth
            credentials). Song queues still work — they just won&apos;t sync to a real YouTube playlist
            until an admin sets <code>GOOGLE_CLIENT_ID</code> / <code>GOOGLE_CLIENT_SECRET</code>.
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            {error === "no_refresh_token"
              ? "Google didn't return a refresh token. Revoke RunTheMic's access in your Google Account and try again."
              : "Something went wrong connecting YouTube. Please try again."}
          </CardContent>
        </Card>
      )}

      {connected && (
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="py-4 text-sm text-emerald-500">YouTube connected successfully.</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connection</CardTitle>
          <CardDescription>
            {connection?.isValid
              ? `Connected as ${connection.googleAccountEmail}`
              : "No YouTube account connected"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <YoutubeConnectPanel connected={Boolean(connection?.isValid)} configured={configured} />
        </CardContent>
      </Card>
    </div>
  );
}
