import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Admin-facing user profile fields. Deliberately excludes secrets
 * (passwordHash, tokenVersion) because the result is passed to client components.
 */
export const adminUserSelect = {
  id: true,
  email: true,
  emailVerified: true,
  firstName: true,
  lastName: true,
  phone: true,
  dateOfBirth: true,
  gender: true,
  maritalStatus: true,
  address: true,
  occupation: true,
  memberSince: true,
  role: true,
  status: true,
  departmentId: true,
  createdAt: true,
  department: { select: { name: true } },
} satisfies Prisma.UserSelect;

export type AdminUserProfile = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>;

/**
 * Request-scoped cached loader for user by ID.
 * Shared between generateMetadata and page component.
 */
export const getUserById = cache(async (id: string): Promise<AdminUserProfile | null> => {
  return prisma.user.findUnique({
    where: { id },
    select: adminUserSelect,
  });
});

/**
 * Request-scoped cached loader for user's giving history and totals.
 */
export const getUserGivingSummary = cache(async (userId: string) => {
  const [transactions, givingTotal] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: { memberId: userId, type: { not: "EXPENSE" }, voidedAt: null },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.financialTransaction.aggregate({
      where: { memberId: userId, type: { not: "EXPENSE" }, voidedAt: null },
      _sum: { amount: true },
    }),
  ]);

  return {
    transactions,
    totalGiving: givingTotal._sum.amount ? Number(givingTotal._sum.amount) : 0,
  };
});
