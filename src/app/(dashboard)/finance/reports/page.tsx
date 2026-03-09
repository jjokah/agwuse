import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { FileText, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ExportButtons } from "@/app/(dashboard)/admin/finance/reports/export-buttons";

export const metadata: Metadata = {
  title: "Finance Reports",
};

export default async function FinanceReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    report?: string;
  }>;
}) {
  await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);
  const { from, to, report } = await searchParams;

  const now = new Date();
  const defaultFrom =
    from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const defaultTo = to || now.toISOString().split("T")[0];
  const reportType = report || "summary";

  const dateFilter = {
    date: {
      gte: new Date(defaultFrom),
      lte: new Date(defaultTo + "T23:59:59"),
    },
  };

  const [transactions, incomeAgg, expenseAgg] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: dateFilter,
      include: {
        member: { select: { firstName: true, lastName: true } },
        recordedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.financialTransaction.aggregate({
      where: { ...dateFilter, type: { not: "EXPENSE" } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financialTransaction.aggregate({
      where: { ...dateFilter, type: "EXPENSE" },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalIncome = incomeAgg._sum.amount ? Number(incomeAgg._sum.amount) : 0;
  const totalExpense = expenseAgg._sum.amount ? Number(expenseAgg._sum.amount) : 0;
  const netIncome = totalIncome - totalExpense;

  const incomeByType: Record<string, number> = {};
  const expenseByCategory: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type === "EXPENSE") {
      const cat = tx.category || "GENERAL";
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(tx.amount);
    } else {
      incomeByType[tx.type] = (incomeByType[tx.type] || 0) + Number(tx.amount);
    }
  }

  const exportData = transactions.map((tx) => ({
    Date: formatDate(tx.date),
    "Receipt #": tx.receiptNumber || "",
    Type: tx.type.replace("_", " "),
    Category: tx.category,
    Member: tx.member ? `${tx.member.firstName} ${tx.member.lastName}` : "",
    Method: PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod,
    Amount: Number(tx.amount).toFixed(2),
    Notes: tx.notes || "",
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      <form className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            From
          </label>
          <Input name="from" type="date" defaultValue={defaultFrom} className="w-44" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            To
          </label>
          <Input name="to" type="date" defaultValue={defaultTo} className="w-44" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Report Type
          </label>
          <select
            name="report"
            defaultValue={reportType}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="summary">Income &amp; Expense Summary</option>
            <option value="income">Income Breakdown</option>
            <option value="expense">Expense Breakdown</option>
            <option value="full">Full Statement</option>
          </select>
        </div>
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Generate
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Income" value={formatCurrency(totalIncome)} icon={<TrendingUp />} />
        <StatCard title="Total Expenses" value={formatCurrency(totalExpense)} icon={<TrendingDown />} />
        <StatCard title="Net Income" value={formatCurrency(netIncome)} icon={<Wallet />} />
        <StatCard title="Transactions" value={String(transactions.length)} icon={<FileText />} />
      </div>

      <ExportButtons
        data={exportData}
        summary={{
          period: `${formatDate(defaultFrom)} - ${formatDate(defaultTo)}`,
          totalIncome,
          totalExpense,
          netIncome,
          incomeByType,
          expenseByCategory,
          transactionCount: transactions.length,
        }}
      />

      {reportType === "summary" || reportType === "income" ? (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Income Breakdown</h2>
          {Object.keys(incomeByType).length === 0 ? (
            <p className="text-sm text-muted-foreground">No income recorded in this period.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(incomeByType).sort(([, a], [, b]) => b - a).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span>{type.replace("_", " ")}</span>
                  <span className="font-semibold">{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t pt-2 font-semibold">
                <span>Total Income</span>
                <span>{formatCurrency(totalIncome)}</span>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {reportType === "summary" || reportType === "expense" ? (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Expense Breakdown</h2>
          {Object.keys(expenseByCategory).length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses recorded in this period.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(expenseByCategory).sort(([, a], [, b]) => b - a).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between text-sm">
                  <span>{category.replace("_", " ")}</span>
                  <span className="font-semibold text-red-600">{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t pt-2 font-semibold">
                <span>Total Expenses</span>
                <span className="text-red-600">{formatCurrency(totalExpense)}</span>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {reportType === "full" ? (
        transactions.length === 0 ? (
          <EmptyState icon={<FileText />} title="No transactions" description="No transactions found in this period." />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{formatDate(tx.date)}</TableCell>
                    <TableCell className="font-mono text-xs">{tx.receiptNumber || "—"}</TableCell>
                    <TableCell>{tx.type.replace("_", " ")}</TableCell>
                    <TableCell>{tx.member ? `${tx.member.firstName} ${tx.member.lastName}` : "—"}</TableCell>
                    <TableCell>{PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod}</TableCell>
                    <TableCell className={`text-right font-semibold ${tx.type === "EXPENSE" ? "text-red-600" : ""}`}>
                      {tx.type === "EXPENSE" ? "-" : "+"}{formatCurrency(Number(tx.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : null}
    </div>
  );
}
