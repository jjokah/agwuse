import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config (no Prisma — used by middleware).
 * The full auth config in auth.ts imports this and adds the Prisma adapter.
 * Callbacks are defined here so the middleware can read custom JWT claims (role, status).
 */
export default {
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: string }).role;
        token.status = (user as { status: string }).status;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as typeof session.user.role;
        session.user.status = token.status as typeof session.user.status;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
