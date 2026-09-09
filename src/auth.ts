import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "OFFICER" | "VENDOR" | "ADMIN";
      vendorId: string | null;
    } & DefaultSession["user"];
  }
}

export const googleEnabled = !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          vendorId: user.vendorId,
        } as { id: string; name: string; email: string; role: string; vendorId: string | null };
      },
    }),
    ...(googleEnabled ? [Google] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // First Google sign-in onboards a new vendor account.
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      const email = user.email?.toLowerCase();
      if (!email) return false;
      const existing = await db.user.findUnique({ where: { email } });
      if (!existing) {
        const profile = await db.vendorProfile.create({
          data: {
            orgName: user.name ?? email.split("@")[0],
            constitution: "Private Limited",
            pan: "",
            gstin: "",
            registeredAddress: "",
          },
        });
        await db.user.create({
          data: {
            email,
            name: user.name ?? email.split("@")[0],
            passwordHash: "",
            role: "VENDOR",
            vendorId: profile.id,
          },
        });
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user && (user as { role?: string }).role) {
        token.role = (user as { role?: string }).role;
        token.vendorId = (user as { vendorId?: string | null }).vendorId ?? null;
      } else if (account?.provider === "google" && token.email) {
        const u = await db.user.findUnique({ where: { email: token.email } });
        if (u) {
          token.role = u.role;
          token.vendorId = u.vendorId;
        }
      }
      return token;
    },
  },
});
