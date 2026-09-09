import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe config (no database, no bcrypt) — imported by middleware AND
 * spread into the full config in src/auth.ts. The jwt/session callbacks here
 * only move data between the token and the session, so they are safe on the edge.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.vendorId = (user as { vendorId?: string | null }).vendorId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "OFFICER" | "VENDOR" | "ADMIN";
        session.user.vendorId = (token.vendorId as string | null) ?? null;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      const wantsVendor = path.startsWith("/vendor");
      const wantsConsole = path.startsWith("/dashboard");
      if (!wantsVendor && !wantsConsole) return true;

      const user = auth?.user as { role?: string } | undefined;
      if (!user) return false;

      if (wantsConsole && user.role !== "OFFICER" && user.role !== "ADMIN") {
        return Response.redirect(new URL("/vendor", nextUrl));
      }
      if (wantsVendor && (user.role === "OFFICER" || user.role === "ADMIN")) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
