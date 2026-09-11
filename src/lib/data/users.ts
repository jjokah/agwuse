import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Request-scoped cached loader for user by ID.
 * Shared between generateMetadata and page component.
 */
export const getUserById = cache(async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    include: { department: { select: { name: true } } },
  });
});

/**
 * Request-scoped cached loader for user's giving history and totals.
 */
export const getUserGivingSummary = cache(async (userId: string) => {
  const [transactions, givingTotal] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: { memberId: userId, type: { not: "EXPENSE" } },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.financialTransaction.aggregate({
      where: { memberId: userId, type: { not: "EXPENSE" } },
      _sum: { amount: true },
    }),
  ]);

  return {
    transactions,
    totalGiving: givingTotal._sum.amount ? Number(givingTotal._sum.amount) : 0,
  };
});
