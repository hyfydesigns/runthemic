import { NextResponse } from "next/server";
import { getOrganizerSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { decryptSecret } from "@/server/crypto";
import { buildYoutubeOAuthClient } from "@/server/youtube/client";

export async function POST() {
  const session = await getOrganizerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connection = await prisma.youtubeConnection.findUnique({ where: { userId: session.user.id } });
  if (connection) {
    // Revoke the grant with Google too (not just forget our copy), so RunTheMic
    // disappears from the user's Google account permissions. Best-effort: if
    // Google rejects it (e.g. the user already revoked it there), we still
    // delete the stored token below.
    try {
      await buildYoutubeOAuthClient().revokeToken(decryptSecret(connection.encryptedRefreshToken));
    } catch (err) {
      console.error("Failed to revoke YouTube token with Google (deleting stored copy anyway)", err);
    }
    await prisma.youtubeConnection.deleteMany({ where: { userId: session.user.id } });
  }

  return NextResponse.json({ ok: true });
}
