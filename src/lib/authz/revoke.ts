import type { Prisma, PrismaClient } from "@prisma/client";

type PrismaTx = PrismaClient | Prisma.TransactionClient;

/**
 * Revokes all active sessions for a user by incrementing their tokenVersion.
 * When the user's JWT is evaluated or refreshed, the version mismatch
 * clears the session and forces re-authentication.
 */
export async function revokeSessions(tx: PrismaTx, userId: string): Promise<number> {
  const user = await tx.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
    select: { tokenVersion: true },
  });
  return user.tokenVersion;
}
