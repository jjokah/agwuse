import type { Prisma } from "@prisma/client";
import { buildTransactionWhere } from "@/lib/finance/transaction-filters";
import { normalizeSearchParams } from "@/lib/search-params";
import type { SearchParamsLike } from "@/lib/pagination";

/** Ownership is always supplied by the authenticated server session. */
export function givingWhere(userId: string, params: SearchParamsLike): Prisma.FinancialTransactionWhereInput {
  const filters = buildTransactionWhere(normalizeSearchParams(params));
  return { AND: [{ memberId: userId, type: { not: "EXPENSE" }, voidedAt: null }, filters] };
}
