import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

/** Audit failure rolls back the mutation. Never include submitted credentials or tokens. */
export function auditedMutation<T extends { id: string }>(
  userId: string, action: string, entity: string,
  mutate: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const result = await mutate(tx);
    await writeAuditLog({ userId, action, entity, entityId: result.id }, tx);
    return result;
  });
}
