import { NextResponse } from "next/server";
import { consumeVerificationToken } from "@/server/email-verification";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (!token || !email) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", base));
  }

  const ok = await consumeVerificationToken(email.toLowerCase(), token);
  return NextResponse.redirect(new URL(ok ? "/login?verified=1" : "/login?error=invalid_token", base));
}
