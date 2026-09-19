export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/** Skips verification (returns true) when Turnstile isn't configured, so forms keep working before a site key is set up. */
export async function verifyTurnstileToken(token: string | null | undefined): Promise<boolean> {
  if (!isTurnstileConfigured()) return true;
  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
