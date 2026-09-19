import { Resend } from "resend";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

let client: Resend | null = null;
function getClient(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

/** Crude HTML-to-text fallback — good enough for our own simple templates, and having any text part at all helps deliverability. */
function toPlainText(html: string): string {
  return html
    .replace(/<a\s+[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis, "$2 ($1)")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * No-ops (just logs) when Resend isn't configured, so the app keeps working
 * in local dev or before a sending domain is set up — matching every other
 * optional integration in this app (YouTube, Stripe, Apple).
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!isEmailConfigured()) {
    console.log(`[email] Not configured — skipped "${subject}" to ${to}`);
    return;
  }

  const { error } = await getClient().emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    html,
    text: toPlainText(html),
  });

  if (error) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, error);
  }
}
