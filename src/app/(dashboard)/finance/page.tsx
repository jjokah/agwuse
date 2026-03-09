import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PlusCircle,
  FileText,
  Receipt,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Finance Dashboard",
};

export default async function FinanceDashboardPage() {
  await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [monthIncome, monthExpense, yearIncome, yearExpense, recentTransactions] =
    await Promise.all([
      prisma.financialTransaction.aggregate({
        where: { type: { not: "EXPENSE" }, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.financialTransaction.aggregate({
        where: { type: "EXPENSE", date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.financialTransaction.aggregate({
        where: { type: { not: "EXPENSE" }, date: { gte: startOfYear } },
        _sum: { amount: true },
      }),
      prisma.financialTransaction.aggregate({
        where: { type: "EXPENSE", date: { gte: startOfYear } },
        _sum: { amount: true },
      }),
      prisma.financialTransaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          member: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

  const monthIncomeAmt = monthIncome._sum.amount ? Number(monthIncome._sum.amount) : 0;
  const monthExpenseAmt = monthExpense._sum.amount ? Number(monthExpense._sum.amount) : 0;
  const yearIncomeAmt = yearIncome._sum.amount ? Number(yearIncome._sum.amount) : 0;
  const yearExpenseAmt = yearExpense._sum.amount ? Number(yearExpense._sum.amount) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Finance Dashboard</h1>
        <div className="flex gap-2">
          <Link
            href="/finance/record"
            className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <PlusCircle className="size-4" />
            Record Transaction
          </Link>
          <Link
            href="/finance/reports"
            className="inline-flex h-9 items-center gap-1 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
          >
            <FileText className="size-4" />
            Reports
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Month Income"
          value={formatCurrency(monthIncomeAmt)}
          icon={<TrendingUp />}
        />
        <StatCard
          title="Month Expenses"
          value={formatCurrency(monthExpenseAmt)}
          icon={<TrendingDown />}
        />
        <StatCard
          title="Year Income"
          value={formatCurrency(yearIncomeAmt)}
          icon={<Wallet />}
        />
        <StatCard
          title="Year Expenses"
          value={formatCurrency(yearExpenseAmt)}
          icon={<Receipt />}
        />
      </div>

      {/* Recent Transactions */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">Recent Transactions</h2>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No transactions recorded yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Receipt #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{formatDate(tx.date)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {tx.receiptNumber || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.type === "EXPENSE" ? "destructive" : "outline"}>
                      {tx.type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tx.member
                      ? `${tx.member.firstName} ${tx.member.lastName}`
                      : "—"}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      tx.type === "EXPENSE" ? "text-red-600" : ""
                    }`}
                  >
                    {tx.type === "EXPENSE" ? "-" : "+"}
                    {formatCurrency(Number(tx.amount))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
