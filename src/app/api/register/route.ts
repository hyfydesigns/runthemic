import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import { registerSchema } from "@/lib/validation/auth";
import { verifyTurnstileToken } from "@/server/turnstile";
import { isEmailConfigured } from "@/server/email/send";
import { issueVerificationEmail } from "@/server/email-verification";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const humanVerified = await verifyTurnstileToken(parsed.data.turnstileToken);
  if (!humanVerified) {
    return NextResponse.json({ error: "Spam check failed — please try again" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  // Auto-verified when email sending isn't configured, so registration (and
  // immediate login) keeps working before a sending domain is set up.
  const autoVerified = !isEmailConfigured();
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      emailVerified: autoVerified ? new Date() : null,
    },
  });

  if (!autoVerified) {
    await issueVerificationEmail(normalizedEmail, name);
  }

  return NextResponse.json({ id: user.id, email: user.email, needsVerification: !autoVerified });
}
