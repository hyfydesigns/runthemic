import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import { getAppleClientSecret } from "@/server/apple-client-secret";

export function isGoogleLoginConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export async function isAppleLoginConfigured(): Promise<boolean> {
  return Boolean(await getAppleClientSecret());
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email;
      const password = credentials?.password;
      if (typeof email !== "string" || typeof password !== "string") return null;

      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return { id: user.id, email: user.email, name: user.name, image: user.image };
    },
  }),
];

if (isGoogleLoginConfigured()) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Basic profile/email only — YouTube playlist access is requested
      // separately from Settings > YouTube, never bundled into login.
      authorization: { params: { scope: "openid email profile" } },
      // Google verifies the email itself, so it's safe to link this
      // sign-in to an existing password account with the same address
      // instead of throwing OAuthAccountNotLinked.
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

const appleClientSecret = await getAppleClientSecret();
if (appleClientSecret && process.env.APPLE_CLIENT_ID) {
  providers.push(
    Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: appleClientSecret,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  // JWT strategy: the Credentials provider does not support NextAuth's
  // database session strategy, so we use JWT sessions for all providers
  // to keep one consistent auth flow across email/password + OAuth.
  session: { strategy: "jwt" },
  // We run our own custom Node server (not Vercel), which sits behind
  // Railway's reverse proxy — without this, Auth.js rejects every request
  // with "UntrustedHost" since it can't otherwise verify the forwarded Host
  // header. NEXTAUTH_URL is still set explicitly, so this is safe.
  trustHost: true,
  pages: { signIn: "/login", error: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export async function getOrganizerSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}
