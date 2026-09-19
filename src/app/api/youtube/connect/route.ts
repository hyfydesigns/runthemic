import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getOrganizerSession } from "@/server/auth";
import { isYoutubeConfigured, buildYoutubeOAuthClient } from "@/server/youtube/client";

export async function GET() {
  const session = await getOrganizerSession();
  if (!session) return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL));

  if (!isYoutubeConfigured()) {
    return NextResponse.redirect(new URL("/settings/youtube?error=not_configured", process.env.NEXTAUTH_URL));
  }

  const state = await new SignJWT({ userId: session.user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(new TextEncoder().encode(process.env.NEXTAUTH_SECRET));

  const oauth2Client = buildYoutubeOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    // youtube: playlist management. email/profile: just enough to label
    // *which* Google account got connected in the settings UI — the
    // callback calls the userinfo endpoint, which 401s without these.
    scope: [
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    state,
  });

  return NextResponse.redirect(url);
}
