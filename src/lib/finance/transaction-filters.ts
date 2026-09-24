import type { Prisma } from "@prisma/client";
import { PAYMENT_METHODS, TRANSACTION_TYPES } from "@/lib/validations/finance";
import { lagosDayEnd, lagosDayStart } from "@/lib/tz";

export interface TransactionFilterParams {
  type?: string;
  method?: string;
  from?: string;
  to?: string;
  q?: string;
}

function isOneOf<T extends string>(values: readonly T[], v: string | undefined): v is T {
  return !!v && (values as readonly string[]).includes(v);
}

/**
 * Builds the Prisma filter for the transactions list pages from untrusted search
 * params. Unknown enum values and malformed dates are ignored (instead of throwing
 * a Prisma error), and dates are whole Lagos calendar days.
 */
export function buildTransactionWhere(params: TransactionFilterParams): Prisma.FinancialTransactionWhereInput {
  const where: Prisma.FinancialTransactionWhereInput = {};

  if (isOneOf(TRANSACTION_TYPES, params.type)) where.type = params.type;
  if (isOneOf(PAYMENT_METHODS, params.method)) where.paymentMethod = params.method;

  const from = params.from ? lagosDayStart(params.from) : null;
  const to = params.to ? lagosDayEnd(params.to) : null;
  if (from || to) {
    where.date = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  const q = params.q?.trim();
  if (q) {
    where.OR = [
      { receiptNumber: { contains: q, mode: "insensitive" } },
      { member: { firstName: { contains: q, mode: "insensitive" } } },
      { member: { lastName: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}
