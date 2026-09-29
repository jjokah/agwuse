import { Prisma, type PrismaClient, type PledgeStatus } from "@prisma/client";

type PrismaTx = PrismaClient | Prisma.TransactionClient;

/** Statuses that still accept payments. OVERDUE is display-only today but treated as open. */
const OPEN_PLEDGE_STATUSES: PledgeStatus[] = ["ACTIVE", "OVERDUE"];

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
 * Status a pledge should have after a payment is reversed (transaction voided).
 * - CANCELLED stays CANCELLED (voiding must never resurrect a cancelled pledge).
 * - FULFILLED drops back to ACTIVE only if the remaining paid amount no longer covers it.
 * - Open pledges keep their status.
 */
export function pledgeStatusAfterReversal(
  currentStatus: PledgeStatus,
  amountPaid: Prisma.Decimal,
  targetAmount: Prisma.Decimal,
): PledgeStatus {
  if (currentStatus === "FULFILLED") {
    return isPledgeFulfilled(amountPaid, targetAmount) ? "FULFILLED" : "ACTIVE";
  }
  return currentStatus;
}

/**
 * Applies a payment amount to a member's pledge.
 * Verifies that:
 * 1. The pledge belongs to the given memberId.
 * 2. The pledge is not in CANCELLED or FULFILLED status.
 *
 * The increment is guarded by a conditional update so a concurrent cancellation
 * cannot be overwritten, and the pledge becomes FULFILLED once amountPaid >= amount.
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

  // Find pledge verifying ownership (also gives precise error messages)
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

  // Atomically increment amountPaid only while the pledge is still open
  const incremented = await tx.pledge.updateMany({
    where: { id: pledgeId, memberId, status: { in: OPEN_PLEDGE_STATUSES } },
    data: { amountPaid: { increment: paymentAmount } },
  });
  if (incremented.count === 0) {
    throw new Error("Pledge is no longer open for payments");
  }

  const updated = await tx.pledge.findUniqueOrThrow({ where: { id: pledgeId } });

  let status = updated.status;
  if (isPledgeFulfilled(updated.amountPaid, updated.amount)) {
    const fulfilled = await tx.pledge.updateMany({
      where: { id: pledgeId, status: { in: OPEN_PLEDGE_STATUSES } },
      data: { status: "FULFILLED" },
    });
    if (fulfilled.count > 0) status = "FULFILLED";
  }

  return {
    pledgeId: updated.id,
    amountPaid: updated.amountPaid,
    status: status as "ACTIVE" | "FULFILLED" | "OVERDUE",
  };
}
