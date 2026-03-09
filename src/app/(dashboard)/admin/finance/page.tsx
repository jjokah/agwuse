import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  PlusCircle,
  FileText,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Finance Management",
};

export default async function AdminFinancePage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    yearIncome,
    yearExpense,
    monthIncome,
    monthExpense,
    totalTransactions,
    recentTransactions,
  ] = await Promise.all([
    prisma.financialTransaction.aggregate({
      where: { type: { not: "EXPENSE" }, date: { gte: startOfYear } },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.aggregate({
      where: { type: "EXPENSE", date: { gte: startOfYear } },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.aggregate({
      where: { type: { not: "EXPENSE" }, date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.aggregate({
      where: { type: "EXPENSE", date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.count(),
    prisma.financialTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        member: { select: { firstName: true, lastName: true } },
        recordedBy: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  const yearIncomeAmt = yearIncome._sum.amount ? Number(yearIncome._sum.amount) : 0;
  const yearExpenseAmt = yearExpense._sum.amount ? Number(yearExpense._sum.amount) : 0;
  const monthIncomeAmt = monthIncome._sum.amount ? Number(monthIncome._sum.amount) : 0;
  const monthExpenseAmt = monthExpense._sum.amount ? Number(monthExpense._sum.amount) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Finance Management</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/finance/transactions/new"
            className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <PlusCircle className="size-4" />
            Record Transaction
          </Link>
          <Link
            href="/admin/finance/reports"
            className="inline-flex h-9 items-center gap-1 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
          >
            <FileText className="size-4" />
            Reports
          </Link>
        </div>
      </div>

      {/* Year Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Year Income"
          value={formatCurrency(yearIncomeAmt)}
          icon={<TrendingUp />}
        />
        <StatCard
          title="Year Expenses"
          value={formatCurrency(yearExpenseAmt)}
          icon={<TrendingDown />}
        />
        <StatCard
          title="Month Income"
          value={formatCurrency(monthIncomeAmt)}
          icon={<Wallet />}
        />
        <StatCard
          title="Month Expenses"
          value={formatCurrency(monthExpenseAmt)}
          icon={<Receipt />}
        />
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/finance/transactions"
          className="rounded-lg border bg-card p-6 transition-colors hover:border-brand-gold"
        >
          <h3 className="font-semibold">Transactions</h3>
          <p className="text-sm text-muted-foreground">
            {totalTransactions} total records
          </p>
        </Link>
        <Link
          href="/admin/finance/pledges"
          className="rounded-lg border bg-card p-6 transition-colors hover:border-brand-gold"
        >
          <h3 className="font-semibold">Pledges</h3>
          <p className="text-sm text-muted-foreground">
            Manage member pledges
          </p>
        </Link>
        <Link
          href="/admin/finance/reports"
          className="rounded-lg border bg-card p-6 transition-colors hover:border-brand-gold"
        >
          <h3 className="font-semibold">Reports</h3>
          <p className="text-sm text-muted-foreground">
            Generate financial reports
          </p>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Recent Transactions</h2>
          <Link
            href="/admin/finance/transactions"
            className="text-sm text-brand-gold-dark hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between text-sm"
            >
              <div>
                <span className="font-medium">{tx.type.replace("_", " ")}</span>
                <span className="ml-2 text-muted-foreground">
                  {tx.member
                    ? `${tx.member.firstName} ${tx.member.lastName}`
                    : "—"}
                </span>
                {tx.receiptNumber && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({tx.receiptNumber})
                  </span>
                )}
              </div>
              <span
                className={`font-semibold ${
                  tx.type === "EXPENSE" ? "text-red-600" : "text-green-600"
                }`}
              >
                {tx.type === "EXPENSE" ? "-" : "+"}
                {formatCurrency(Number(tx.amount))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
