import { prisma } from "@/lib/prisma";
import { recordTransaction } from "@/lib/finance/record-transaction";
import { isUniqueViolation } from "@/lib/prisma-errors";

export interface PaystackPaymentData {
  reference: string;
  amount: number; // amount in Naira
  currency: string;
  paid_at?: string;
  customer?: { email?: string };
  metadata?: Record<string, unknown>;
}

export type RecordPaystackResult =
  | { status: "success"; receiptNumber: string | null }
  | { status: "already_processed"; receiptNumber?: string | null }
  | { status: "mismatch"; message: string }
  | { status: "ignored"; message: string };

/**
 * Handles recording a verified Paystack payment idempotently.
 *
 * Rules:
 * 1. Non-NGN currency: audit and return ignored (200).
 * 2. If paystackRef already recorded: return already_processed (200).
 * 3. If PaymentIntent found:
 *    - Amount and currency must match. On mismatch, mark intent FAILED, audit, and return mismatch (200).
 *    - Type, category, and memberId come strictly from the intent.
 *    - Mark intent SUCCEEDED with transactionId link.
 * 4. If no PaymentIntent found:
 *    - Record as DONATION / GENERAL with no member and audit PAYSTACK_UNMATCHED.
 */
export async function recordPaystackPayment(
  data: PaystackPaymentData,
): Promise<RecordPaystackResult> {
  // Find system user (SUPER_ADMIN) for ledger recordedById & audit logging
  const systemUser = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { id: true },
  });
  if (!systemUser) {
    throw new Error("No system user found for Paystack recording");
  }

  // 1. Currency check
  if (data.currency !== "NGN") {
    await prisma.auditLog.create({
      data: {
        action: "PAYSTACK_NON_NGN_CURRENCY",
        entity: "PaymentIntent",
        entityId: data.reference,
        userId: systemUser.id,
        details: JSON.stringify({ currency: data.currency, reference: data.reference }),
      },
    });
    return { status: "ignored", message: `Unsupported currency: ${data.currency}` };
  }

  // 2. Idempotency check
  const existing = await prisma.financialTransaction.findUnique({
    where: { paystackRef: data.reference },
    select: { id: true, receiptNumber: true },
  });
  if (existing) {
    return { status: "already_processed", receiptNumber: existing.receiptNumber };
  }

  // 3. Resolve PaymentIntent
  const intentRef = (data.metadata?.intentRef as string) || data.reference;
  const intent = await prisma.paymentIntent.findUnique({
    where: { reference: intentRef },
  });

  try {
    if (intent) {
      // Check amount and currency match
      const intentAmount = Number(intent.amount);
      if (Math.abs(intentAmount - data.amount) > 0.01 || intent.currency !== data.currency) {
        await prisma.$transaction(async (tx) => {
          await tx.paymentIntent.update({
            where: { reference: intent.reference },
            data: { status: "FAILED" },
          });
          await tx.auditLog.create({
            data: {
              action: "PAYSTACK_INTENT_MISMATCH",
              entity: "PaymentIntent",
              entityId: intent.reference,
              userId: systemUser.id,
              details: JSON.stringify({
                expectedAmount: intent.amount.toString(),
                receivedAmount: data.amount,
                expectedCurrency: intent.currency,
                receivedCurrency: data.currency,
                reference: data.reference,
              }),
            },
          });
        });
        return { status: "mismatch", message: "Amount or currency mismatch" };
      }

      // Record transaction using authoritative intent fields
      const transaction = await prisma.$transaction(async (tx) => {
        const txn = await recordTransaction(tx, {
          type: intent.type,
          category: intent.category,
          amount: intent.amount,
          currency: "NGN",
          paymentMethod: "ONLINE",
          paystackRef: data.reference,
          memberId: intent.memberId,
          date: data.paid_at ? new Date(data.paid_at) : new Date(),
          recordedById: systemUser.id,
          notes: `Online payment via Paystack. Email: ${data.customer?.email || intent.email}`,
          auditAction: "PAYSTACK_PAYMENT",
        });

        await tx.paymentIntent.update({
          where: { reference: intent.reference },
          data: {
            status: "SUCCEEDED",
            transactionId: txn.id,
          },
        });

        return txn;
      });

      return { status: "success", receiptNumber: transaction.receiptNumber };
    }

    // 4. No intent found — fallback to DONATION/GENERAL with PAYSTACK_UNMATCHED audit
    const transaction = await prisma.$transaction(async (tx) => {
      const txn = await recordTransaction(tx, {
        type: "DONATION",
        category: "GENERAL",
        amount: data.amount,
        currency: "NGN",
        paymentMethod: "ONLINE",
        paystackRef: data.reference,
        memberId: null,
        date: data.paid_at ? new Date(data.paid_at) : new Date(),
        recordedById: systemUser.id,
        notes: `Unmatched online payment via Paystack. Email: ${data.customer?.email || "N/A"}`,
        auditAction: "PAYSTACK_UNMATCHED",
      });
      return txn;
    });

    return { status: "success", receiptNumber: transaction.receiptNumber };
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      return { status: "already_processed" };
    }
    throw err;
  }
}
