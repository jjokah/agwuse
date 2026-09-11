import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface IncomeBreakdownItem {
  type: string;
  total: Prisma.Decimal;
  count: number;
}

export interface ExpenseBreakdownItem {
  category: string;
  total: Prisma.Decimal;
  count: number;
}

export interface FinanceReportData {
  from: Date;
  to: Date;
  totalIncome: Prisma.Decimal;
  totalExpense: Prisma.Decimal;
  netIncome: Prisma.Decimal;
  transactionCount: number;
  incomeByType: IncomeBreakdownItem[];
  expenseByCategory: ExpenseBreakdownItem[];
  transactions: {
    id: string;
    date: Date;
    receiptNumber: string | null;
    type: string;
    category: string | null;
    customCategory?: string | null;
    amount: Prisma.Decimal;
    paymentMethod: string;
    notes: string | null;
    member: { firstName: string; lastName: string } | null;
  }[];
}

/**
 * Single authoritative source for financial report aggregations.
 * Uses database-level aggregations and groupBy instead of client/server JS loops.
 * Totals stay as Prisma.Decimal until UI display/formatting.
 */
export async function getFinanceReportData(
  fromDate: Date,
  toDate: Date,
  maxTransactions = 1000,
): Promise<FinanceReportData> {
  const dateFilter: Prisma.FinancialTransactionWhereInput = {
    date: {
      gte: fromDate,
      lte: toDate,
    },
    voidedAt: null,
  };

  const [
    incomeAgg,
    expenseAgg,
    incomeGroups,
    expenseGroups,
    transactions,
  ] = await Promise.all([
    // 1. Total income
    prisma.financialTransaction.aggregate({
      where: { ...dateFilter, type: { not: "EXPENSE" } },
      _sum: { amount: true },
      _count: true,
    }),
    // 2. Total expense
    prisma.financialTransaction.aggregate({
      where: { ...dateFilter, type: "EXPENSE" },
      _sum: { amount: true },
      _count: true,
    }),
    // 3. Income grouped by type
    prisma.financialTransaction.groupBy({
      by: ["type"],
      where: { ...dateFilter, type: { not: "EXPENSE" } },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: "desc" } },
    }),
    // 4. Expense grouped by category
    prisma.financialTransaction.groupBy({
      by: ["category"],
      where: { ...dateFilter, type: "EXPENSE" },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: "desc" } },
    }),
    // 5. Transaction list for detail tables and exports
    prisma.financialTransaction.findMany({
      where: dateFilter,
      select: {
        id: true,
        date: true,
        receiptNumber: true,
        type: true,
        category: true,
        amount: true,
        paymentMethod: true,
        notes: true,
        member: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: "asc" },
      take: maxTransactions,
    }),
  ]);

  const totalIncome = incomeAgg._sum.amount ?? new Prisma.Decimal(0);
  const totalExpense = expenseAgg._sum.amount ?? new Prisma.Decimal(0);
  const netIncome = totalIncome.minus(totalExpense);
  const transactionCount = (incomeAgg._count ?? 0) + (expenseAgg._count ?? 0);

  const incomeByType: IncomeBreakdownItem[] = incomeGroups.map((g) => ({
    type: g.type,
    total: g._sum.amount ?? new Prisma.Decimal(0),
    count: g._count,
  }));

  const expenseByCategory: ExpenseBreakdownItem[] = expenseGroups.map((g) => ({
    category: g.category ?? "GENERAL",
    total: g._sum.amount ?? new Prisma.Decimal(0),
    count: g._count,
  }));

  return {
    from: fromDate,
    to: toDate,
    totalIncome,
    totalExpense,
    netIncome,
    transactionCount,
    incomeByType,
    expenseByCategory,
    transactions,
  };
}
