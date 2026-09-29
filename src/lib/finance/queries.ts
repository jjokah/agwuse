import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { pledgeStatusAfterReversal } from "@/lib/finance/pledges";

/**
 * Ensures any query for active financial transactions strictly excludes voided transactions.
 */
export function activeTransactionWhere(
  where: Prisma.FinancialTransactionWhereInput = {},
): Prisma.FinancialTransactionWhereInput {
  return {
    ...where,
    voidedAt: null,
  };
}

export interface VoidTransactionResult {
  success: boolean;
  error?: string;
}

/** Errors whose message is safe to show to the finance user. */
class VoidTransactionError extends Error {}

/**
 * Voids a financial transaction.
 *
 * Rules:
 * 1. Restricted to FINANCE, ADMIN, SUPER_ADMIN.
 * 2. If already voided, fails (enforced by a conditional update, so concurrent
 *    voids cannot both succeed and double-reverse a pledge).
 * 3. Reverses the pledge payment only if it was actually applied (pledge + member
 *    were both set when recorded). amountPaid is decremented atomically; a
 *    CANCELLED pledge stays CANCELLED and a FULFILLED pledge reopens only if it is
 *    no longer covered.
 * 4. Marks voidedAt, voidedById, voidReason.
 * 5. The receipt number stays assigned to preserve audit sequence integrity.
 * 6. Creates an audit log entry.
 */
export async function voidTransaction(
  id: string,
  reason: string,
): Promise<VoidTransactionResult> {
  const session = await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);
  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    return { success: false, error: "A reason is required to void a transaction" };
  }
  if (trimmedReason.length > 500) {
    return { success: false, error: "Reason must be at most 500 characters" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const transaction = await tx.financialTransaction.findUnique({
        where: { id },
        select: {
          amount: true,
          type: true,
          receiptNumber: true,
          pledgeId: true,
          memberId: true,
        },
      });

      if (!transaction) {
        throw new VoidTransactionError("Transaction not found");
      }

      // Conditional update: only one concurrent void can win
      const marked = await tx.financialTransaction.updateMany({
        where: { id, voidedAt: null },
        data: {
          voidedAt: new Date(),
          voidedById: session.user.id,
          voidReason: trimmedReason,
        },
      });
      if (marked.count === 0) {
        throw new VoidTransactionError("Transaction is already voided");
      }

      // Reverse pledge payment only if recordTransaction applied it
      if (transaction.pledgeId && transaction.memberId) {
        let pledge = await tx.pledge.update({
          where: { id: transaction.pledgeId },
          data: { amountPaid: { decrement: transaction.amount } },
        });
        if (pledge.amountPaid.lt(0)) {
          pledge = await tx.pledge.update({
            where: { id: pledge.id },
            data: { amountPaid: 0 },
          });
        }
        const nextStatus = pledgeStatusAfterReversal(pledge.status, pledge.amountPaid, pledge.amount);
        if (nextStatus !== pledge.status) {
          await tx.pledge.update({
            where: { id: pledge.id },
            data: { status: nextStatus },
          });
        }
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          action: "VOID_TRANSACTION",
          entity: "FinancialTransaction",
          entityId: id,
          userId: session.user.id,
          details: JSON.stringify({
            reason: trimmedReason,
            amount: transaction.amount.toString(),
            receiptNumber: transaction.receiptNumber,
            type: transaction.type,
            pledgeId: transaction.pledgeId,
          }),
        },
      });
    });

    return { success: true };
  } catch (err: unknown) {
    if (err instanceof VoidTransactionError) {
      return { success: false, error: err.message };
    }
    console.error("voidTransaction error:", err);
    return { success: false, error: "Failed to void transaction" };
  }
}
