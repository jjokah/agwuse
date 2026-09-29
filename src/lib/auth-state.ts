import { cache } from "react";
import { prisma } from "@/lib/prisma";

export interface AuthoritativeUserState {
  id: string;
  role: string;
  status: string;
  tokenVersion: number;
  name: string | null;
  image: string | null;
  profilePhoto: string | null;
  email: string;
}

/**
 * Authoritative, per-request cached database read of the user's current
 * role, status, tokenVersion, name, and image.
 * React cache() ensures this query executes at most ONCE per server request.
 */
export const getAuthState = cache(
  async (userId: string): Promise<AuthoritativeUserState | null> => {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        tokenVersion: true,
        name: true,
        image: true,
        profilePhoto: true,
        email: true,
      },
    });
  },
);
