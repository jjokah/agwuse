import { Prisma, type PrismaClient } from "@prisma/client";

type PrismaTx = PrismaClient | Prisma.TransactionClient;

export interface ApplyPledgePaymentResult {
  pledgeId: string;
  amountPaid: Prisma.Decimal;
  status: "ACTIVE" | "FULFILLED" | "OVERDUE";
}

/**
 * Computes whether a pledge is fulfilled based on amountPaid >= amount.
 */
export function isPledgeFulfilled(
  amountPaid: Prisma.Decimal,
  targetAmount: Prisma.Decimal,
): boolean {
  return amountPaid.gte(targetAmount);
}

/**
 * Applies a payment amount to a member's pledge.
 * Verifies that:
 * 1. The pledge belongs to the given memberId.
 * 2. The pledge is not in CANCELLED or FULFILLED status.
 *
 * Increments amountPaid in the database and updates status to FULFILLED if amountPaid >= amount.
 */
export async function applyPledgePayment(
  tx: PrismaTx,
  input: {
    pledgeId: string;
    memberId: string;
    amount: Prisma.Decimal | number | string;
  },
): Promise<ApplyPledgePaymentResult> {
  const { pledgeId, memberId, amount } = input;
  const paymentAmount = new Prisma.Decimal(amount);

  if (paymentAmount.lte(0)) {
    throw new Error("Pledge payment amount must be greater than zero");
  }

  // Find pledge verifying ownership
  const pledge = await tx.pledge.findFirst({
    where: { id: pledgeId, memberId },
  });

  if (!pledge) {
    throw new Error("Pledge not found for this member");
  }

  if (pledge.status === "CANCELLED") {
    throw new Error("Cannot apply payment to a cancelled pledge");
  }

  if (pledge.status === "FULFILLED") {
    throw new Error("Cannot apply payment to an already fulfilled pledge");
  }

  // Atomically increment amountPaid in database
  const updated = await tx.pledge.update({
    where: { id: pledgeId },
    data: {
      amountPaid: { increment: paymentAmount },
    },
  });

  // Calculate new status
  const fulfilled = isPledgeFulfilled(updated.amountPaid, updated.amount);
  const newStatus = fulfilled ? "FULFILLED" : updated.status;

  if (newStatus !== updated.status) {
    await tx.pledge.update({
      where: { id: pledgeId },
      data: { status: newStatus },
    });
  }

  return {
    pledgeId: updated.id,
    amountPaid: updated.amountPaid,
    status: newStatus as "ACTIVE" | "FULFILLED" | "OVERDUE",
  };
}
