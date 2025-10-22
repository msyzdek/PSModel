import type { NextAuthOptions, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import type { JWT } from "next-auth/jwt";

type AugmentedJWT = JWT & { shareholderId?: string | null };

function parseAllowlist(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function emailMatchesDomain(email: string | null | undefined, domain: string | undefined) {
  if (!email || !domain) return false;
  return email.toLowerCase().endsWith("@" + domain.toLowerCase());
}

function emailInAllowlist(email: string | null | undefined, allow: string[]): boolean {
  if (!email) return false;
  return allow.includes(email.toLowerCase());
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      const allowedDomain = process.env.AUTH_ALLOWED_DOMAIN?.trim();
      const allowlist = parseAllowlist(process.env.AUTH_ALLOWED_EMAILS);
      const email = user?.email ?? null;

      if (emailInAllowlist(email, allowlist)) return true;
      if (emailMatchesDomain(email, allowedDomain)) return true;
      return false;
    },
    async jwt({ token, user }) {
      // On initial sign in, try to map to Shareholder by email
      if (user?.email) {
        try {
          const sh = await prisma.shareholder.findUnique({ where: { email: user.email } });
          if (sh) {
            (token as AugmentedJWT).shareholderId = sh.id;
          }
        } catch {
          // Fail silent; mapping is optional
        }
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      // Attach shareholderId if present on token
      (session as Session & { shareholderId?: string | null }).shareholderId =
        (token as AugmentedJWT).shareholderId ?? null;
      return session;
    },
  },
};

export function getSession() {
  return getServerSession(authOptions);
}
