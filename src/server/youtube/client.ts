import { google } from "googleapis";
import { prisma } from "@/server/db";
import { decryptSecret } from "@/server/crypto";

export function isYoutubeConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function buildYoutubeOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_URL } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("YouTube integration is not configured (missing GOOGLE_CLIENT_ID/SECRET)");
  }
  const redirectUri = `${(NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "")}/api/youtube/callback`;
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
}

/**
 * Returns an authenticated youtube('v3') client for the given user, or null
 * if they haven't connected YouTube (or the connection needs re-auth).
 * googleapis refreshes the access token from the stored refresh token on
 * each call automatically — we never persist access tokens ourselves.
 */
export async function getYoutubeClientForUser(userId: string) {
  const connection = await prisma.youtubeConnection.findUnique({ where: { userId } });
  if (!connection || !connection.isValid) return null;

  const oauth2Client = buildYoutubeOAuthClient();
  oauth2Client.setCredentials({ refresh_token: decryptSecret(connection.encryptedRefreshToken) });

  oauth2Client.on("tokens", () => {
    // access token refreshed transparently; nothing to persist (only the refresh token is stored)
  });

  return google.youtube({ version: "v3", auth: oauth2Client });
}

export async function markYoutubeConnectionInvalid(userId: string) {
  await prisma.youtubeConnection.updateMany({ where: { userId }, data: { isValid: false } });
}
