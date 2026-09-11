import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { refreshToken, type AuthToken } from "@/lib/auth-token";
import type { Adapter } from "next-auth/adapters";
import type { UserRole } from "@/lib/constants";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days sliding
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        if (user.status !== "ACTIVE") {
          throw new Error("ACCOUNT_NOT_ACTIVE");
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.profilePhoto || user.image,
          role: user.role,
          status: user.status,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: UserRole }).role;
        token.status = (user as { status: "PENDING" | "ACTIVE" | "INACTIVE" }).status;
        token.tv = (user as { tokenVersion?: number }).tokenVersion ?? 0;
        token.chk = Math.floor(Date.now() / 1000);
        return token;
      }

      const refreshed = await refreshToken(
        token as AuthToken,
        async (userId: string) => {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              role: true,
              status: true,
              tokenVersion: true,
              name: true,
              profilePhoto: true,
              image: true,
            },
          });
          if (!dbUser) return null;
          return {
            role: dbUser.role,
            status: dbUser.status,
            tokenVersion: dbUser.tokenVersion,
            name: dbUser.name,
            image: dbUser.profilePhoto || dbUser.image,
          };
        },
        { trigger },
      );

      if (!refreshed) {
        // Return null so session is cleared
        return null as unknown as typeof token;
      }

      return refreshed as unknown as typeof token;
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as typeof session.user.role;
        session.user.status = token.status as typeof session.user.status;
        session.user.tokenVersion = token.tv as number | undefined;
      }
      return session;
    },
  },
});

export { requireAuth, requireRole, requirePageRole } from "@/lib/auth-guards";
