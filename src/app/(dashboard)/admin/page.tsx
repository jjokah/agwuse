import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency } from "@/lib/utils";
import { Users, UserPlus, Wallet, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    totalMembers,
    newThisMonth,
    pendingApprovals,
    totalGivingThisYear,
    recentUsers,
    recentTransactions,
  ] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.financialTransaction.aggregate({
      where: {
        type: { not: "EXPENSE" },
        date: { gte: startOfYear },
      },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.financialTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { member: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const yearGiving = totalGivingThisYear._sum.amount
    ? Number(totalGivingThisYear._sum.amount)
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Members"
          value={totalMembers}
          icon={<Users />}
        />
        <StatCard
          title="New This Month"
          value={newThisMonth}
          icon={<UserPlus />}
        />
        <StatCard
          title="Pending Approvals"
          value={pendingApprovals}
          icon={<Clock />}
        />
        <StatCard
          title="Giving (This Year)"
          value={formatCurrency(yearGiving)}
          icon={<Wallet />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Recent Registrations</h2>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.status === "ACTIVE"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : user.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {user.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Recent Transactions</h2>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No transactions yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium">{tx.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.member
                        ? `${tx.member.firstName} ${tx.member.lastName}`
                        : "Anonymous"}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(Number(tx.amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
