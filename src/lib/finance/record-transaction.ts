import {
  Prisma,
  type PrismaClient,
  type TransactionType,
  type OfferingCategory,
  type PaymentMethod,
  type FinancialTransaction,
} from "@prisma/client";
import { nextReceiptNumber } from "@/lib/finance/receipts";
import { applyPledgePayment } from "@/lib/finance/pledges";
import { after } from "next/server";
import { sendGiftReceiptEmail } from "@/lib/email/send";
import { formatCurrency, formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { TRANSACTION_TYPE_LABELS } from "@/lib/finance/labels";

type PrismaTx = PrismaClient | Prisma.TransactionClient;

export interface RecordTransactionInput {
  type: TransactionType;
  category?: OfferingCategory | null;
  customCategory?: string | null;
  amount: Prisma.Decimal | number | string;
  currency?: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  date?: Date | string;
  notes?: string | null;
  paystackRef?: string | null;
  memberId?: string | null;
  recordedById: string;
  pledgeId?: string | null;
  auditAction?: string;
  auditDetails?: Record<string, unknown>;
}

/**
 * Single authoritative write path for financial transactions.
 * Shared by:
 * - Admin finance actions (`createTransaction`)
 * - Paystack webhook (`/api/paystack/webhook`)
 * - Paystack verification route (`/api/paystack/verify`)
 *
 * Atomically:
 * 1. Allocates the next receipt number for the Lagos calendar year.
 * 2. Inserts the transaction ledger row.
 * 3. Applies pledge payments if a pledgeId is linked.
 * 4. Records the audit log entry.
 *
 * The gift receipt email is NOT sent from here: this runs inside the caller's
 * database transaction, which may still roll back. Callers must invoke
 * scheduleReceiptEmail() after the transaction has committed.
 */
export async function recordTransaction(
  tx: PrismaTx,
  input: RecordTransactionInput,
): Promise<FinancialTransaction> {
  const amountDecimal = new Prisma.Decimal(input.amount);
  const dateObj = input.date ? new Date(input.date) : new Date();

  // 1. Allocate receipt number
  const receiptNumber = await nextReceiptNumber(tx, dateObj);

  // 2. Insert transaction
  const transaction = await tx.financialTransaction.create({
    data: {
      type: input.type,
      category: input.category || "GENERAL",
      customCategory: input.customCategory || null,
      amount: amountDecimal,
      currency: input.currency || "NGN",
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber || null,
      date: dateObj,
      notes: input.notes || null,
      receiptNumber,
      paystackRef: input.paystackRef || null,
      memberId: input.memberId || null,
      recordedById: input.recordedById,
      pledgeId: input.pledgeId || null,
    },
  });

  // 3. Apply pledge payment if linked
  if (input.pledgeId && input.memberId) {
    await applyPledgePayment(tx, {
      pledgeId: input.pledgeId,
      memberId: input.memberId,
      amount: amountDecimal,
    });
  }

  // 4. Record audit log
  await tx.auditLog.create({
    data: {
      action: input.auditAction || "RECORD_TRANSACTION",
      entity: "FinancialTransaction",
      entityId: transaction.id,
      userId: input.recordedById,
      details: JSON.stringify({
        receiptNumber,
        amount: amountDecimal.toString(),
        type: input.type,
        category: input.category,
        paymentMethod: input.paymentMethod,
        paystackRef: input.paystackRef,
        ...input.auditDetails,
      }),
    },
  });

  return transaction;
}

/**
 * Schedules the gift receipt email for a committed transaction (non-blocking).
 * Must be called only after the surrounding database transaction has committed,
 * so donors never receive a receipt number that was rolled back.
 */
export function scheduleReceiptEmail(
  transaction: Pick<
    FinancialTransaction,
    "type" | "receiptNumber" | "amount" | "date" | "category" | "memberId"
  >,
  options: { donorEmail?: string | null } = {},
): void {
  const { receiptNumber } = transaction;
  if (transaction.type === "EXPENSE" || !receiptNumber) return;

  const sendReceiptTask = async () => {
    try {
      let email = options.donorEmail ?? null;
      let memberName: string | null = null;

      if (transaction.memberId) {
        const member = await prisma.user.findUnique({
          where: { id: transaction.memberId },
          select: { email: true, firstName: true, lastName: true },
        });
        if (member) {
          email = email || member.email;
          memberName = `${member.firstName} ${member.lastName}`.trim();
        }
      }

      if (email) {
        await sendGiftReceiptEmail(email, {
          receiptNumber,
          amount: formatCurrency(Number(transaction.amount)),
          date: formatDate(transaction.date),
          type: TRANSACTION_TYPE_LABELS[transaction.type] ?? transaction.type,
          category: transaction.category || undefined,
          memberName,
          idempotencyKey: `receipt-${receiptNumber}`,
        });
      }
    } catch (emailErr) {
      console.error("Non-blocking gift receipt email error:", emailErr);
    }
  };

  try {
    after(sendReceiptTask);
  } catch {
    // Outside a request scope (e.g. scripts): send without blocking the caller
    void sendReceiptTask();
  }
}
