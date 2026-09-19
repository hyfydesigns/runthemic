import { nanoid } from "nanoid";
import { prisma } from "@/server/db";
import { sendEmail, isEmailConfigured } from "@/server/email/send";
import { verificationEmailHtml } from "@/server/email/templates";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function issueVerificationEmail(email: string, name: string) {
  if (!isEmailConfigured()) return;

  const token = nanoid(32);
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires: new Date(Date.now() + TOKEN_TTL_MS) },
  });

  const verifyUrl = `${(process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "")}/api/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  await sendEmail({
    to: email,
    subject: "Verify your email for RunTheMic",
    html: verificationEmailHtml({ name, verifyUrl }),
  });
}

export async function consumeVerificationToken(email: string, token: string): Promise<boolean> {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.identifier !== email || record.expires < new Date()) return false;

  await prisma.$transaction([
    prisma.verificationToken.delete({ where: { token } }),
    prisma.user.update({ where: { email }, data: { emailVerified: new Date() } }),
  ]);

  return true;
}
