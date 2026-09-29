import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PrismaTx = PrismaClient | Prisma.TransactionClient;

export interface AuditEntry {
  action: string;
  entity: string;
  entityId: string;
  /** The authenticated actor. Always passed explicitly by the (already authorized) caller. */
  userId: string;
  details?: string | Record<string, unknown> | null;
}

/**
 * Writes an audit log entry.
 *
 * This deliberately lives outside any "use server" module: exported functions in
 * such modules become publicly callable server actions, and an audit writer must
 * never be invokable by clients. Pass `tx` to make the entry atomic with the
 * mutation it records.
 */
export async function writeAuditLog(entry: AuditEntry, tx: PrismaTx = prisma): Promise<void> {
  const details =
    entry.details == null
      ? null
      : typeof entry.details === "string"
        ? entry.details
        : JSON.stringify(entry.details);

  await tx.auditLog.create({
    data: {
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      userId: entry.userId,
      details,
    },
  });
}
