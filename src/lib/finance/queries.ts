import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Prisma } from "@prisma/client";

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

/**
 * Voids a financial transaction.
 *
 * Rules:
 * 1. Restricted to FINANCE, ADMIN, SUPER_ADMIN.
 * 2. If already voided, fails.
 * 3. Reverses any associated pledge payment (decrements amountPaid, resets status to ACTIVE if was FULFILLED).
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

  try {
    await prisma.$transaction(async (tx) => {
      const transaction = await tx.financialTransaction.findUnique({
        where: { id },
        include: { pledge: true },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      if (transaction.voidedAt) {
        throw new Error("Transaction is already voided");
      }

      // Reverse pledge payment if linked
      if (transaction.pledgeId) {
        const pledge = transaction.pledge;
        if (pledge) {
          const newAmountPaid = Prisma.Decimal.max(
            0,
            pledge.amountPaid.minus(transaction.amount),
          );
          await tx.pledge.update({
            where: { id: transaction.pledgeId },
            data: {
              amountPaid: newAmountPaid,
              status: "ACTIVE",
            },
          });
        }
      }

      // Mark transaction as voided
      await tx.financialTransaction.update({
        where: { id },
        data: {
          voidedAt: new Date(),
          voidedById: session.user.id,
          voidReason: trimmedReason,
        },
      });

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
    console.error("voidTransaction error:", err);
    const message = err instanceof Error ? err.message : "Failed to void transaction";
    return { success: false, error: message };
  }
}

/**
 * Updates non-money metadata fields on a transaction.
 * Amounts, currencies, and types are immutable and cannot be changed here (must be voided and re-recorded).
 */
export async function updateTransactionDetails(
  id: string,
  details: {
    notes?: string | null;
    referenceNumber?: string | null;
  },
) {
  const session = await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);

  const transaction = await prisma.financialTransaction.findUnique({
    where: { id },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  if (transaction.voidedAt) {
    throw new Error("Cannot edit details of a voided transaction");
  }

  const updated = await prisma.financialTransaction.update({
    where: { id },
    data: {
      notes: details.notes !== undefined ? details.notes : transaction.notes,
      referenceNumber:
        details.referenceNumber !== undefined
          ? details.referenceNumber
          : transaction.referenceNumber,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "UPDATE_TRANSACTION_DETAILS",
      entity: "FinancialTransaction",
      entityId: id,
      userId: session.user.id,
      details: JSON.stringify({
        previousNotes: transaction.notes,
        newNotes: details.notes,
        previousRef: transaction.referenceNumber,
        newRef: details.referenceNumber,
      }),
    },
  });

  return updated;
}
