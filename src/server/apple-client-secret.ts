import { SignJWT, importPKCS8 } from "jose";

const APPLE_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days, well under Apple's 6-month max

let cached: { secret: string; expiresAt: number } | null = null;

/**
 * Apple's "client secret" is a self-signed ES256 JWT generated from your
 * private key rather than a static string, so we build it on demand.
 */
export async function getAppleClientSecret(): Promise<string | null> {
  const { APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY } = process.env;
  if (!APPLE_CLIENT_ID || !APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_PRIVATE_KEY) {
    return null;
  }

  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.secret;
  }

  try {
    const privateKey = await importPKCS8(
      APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      "ES256",
    );
    const now = Math.floor(Date.now() / 1000);
    const exp = now + APPLE_TOKEN_TTL_SECONDS;
    const secret = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: APPLE_KEY_ID })
      .setIssuer(APPLE_TEAM_ID)
      .setIssuedAt(now)
      .setExpirationTime(exp)
      .setAudience("https://appleid.apple.com")
      .setSubject(APPLE_CLIENT_ID)
      .sign(privateKey);

    cached = { secret, expiresAt: exp * 1000 };
    return secret;
  } catch (err) {
    console.error("Failed to generate Apple client secret", err);
    return null;
  }
}
