import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { issueVerificationEmail } from "@/server/email-verification";

const schema = z.object({ email: z.string().trim().email() });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Same response whether or not the account exists/needs it — avoids
  // leaking which emails are registered.
  if (user && !user.emailVerified) {
    await issueVerificationEmail(email, user.name ?? "there");
  }

  return NextResponse.json({ ok: true });
}
