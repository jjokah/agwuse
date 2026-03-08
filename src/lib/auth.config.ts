import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config (no Prisma — used by middleware).
 * The full auth config in auth.ts imports this and adds the Prisma adapter.
 */
export default {
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
} satisfies NextAuthConfig;
