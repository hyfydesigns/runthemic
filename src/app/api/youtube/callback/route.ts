import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/server/db";
import { buildYoutubeOAuthClient } from "@/server/youtube/client";
import { encryptSecret } from "@/server/crypto";
import { google } from "googleapis";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (!code || !state) {
    return NextResponse.redirect(new URL("/settings/youtube?error=missing_code", base));
  }

  let userId: string;
  try {
    const { payload } = await jwtVerify<{ userId: string }>(
      state,
      new TextEncoder().encode(process.env.NEXTAUTH_SECRET),
    );
    userId = payload.userId;
  } catch {
    return NextResponse.redirect(new URL("/settings/youtube?error=invalid_state", base));
  }

  try {
    const oauth2Client = buildYoutubeOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      // Happens if the user has connected before without revoking access first
      // (Google only issues a refresh token on first consent, or with prompt=consent).
      return NextResponse.redirect(new URL("/settings/youtube?error=no_refresh_token", base));
    }

    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const me = await oauth2.userinfo.get();

    await prisma.youtubeConnection.upsert({
      where: { userId },
      create: {
        userId,
        googleAccountEmail: me.data.email ?? "unknown",
        encryptedRefreshToken: encryptSecret(tokens.refresh_token),
        scope: tokens.scope ?? "",
        accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        isValid: true,
      },
      update: {
        googleAccountEmail: me.data.email ?? "unknown",
        encryptedRefreshToken: encryptSecret(tokens.refresh_token),
        scope: tokens.scope ?? "",
        accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        isValid: true,
      },
    });

    return NextResponse.redirect(new URL("/settings/youtube?connected=1", base));
  } catch (err) {
    console.error("YouTube OAuth callback failed", err);
    return NextResponse.redirect(new URL("/settings/youtube?error=oauth_failed", base));
  }
}
