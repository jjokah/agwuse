import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { StatCard } from "@/components/shared/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { FinanceReportData } from "@/lib/data/finance-reports";

export interface ReportTablesProps {
  data: FinanceReportData;
  reportType?: string;
}

export function ReportTables({ data, reportType = "summary" }: ReportTablesProps) {
  const totalIncomeNum = Number(data.totalIncome);
  const totalExpenseNum = Number(data.totalExpense);
  const netIncomeNum = Number(data.netIncome);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(totalIncomeNum)}
          icon={<TrendingUp />}
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(totalExpenseNum)}
          icon={<TrendingDown />}
        />
        <StatCard
          title="Net Income"
          value={formatCurrency(netIncomeNum)}
          icon={<Wallet />}
        />
        <StatCard
          title="Transactions"
          value={String(data.transactionCount)}
          icon={<FileText />}
        />
      </div>

      {/* Income Breakdown */}
      {(reportType === "summary" || reportType === "income") && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Income Breakdown</h2>
          {data.incomeByType.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No income recorded in this period.
            </p>
          ) : (
            <div className="space-y-2">
              {data.incomeByType.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {item.type.replace("_", " ")}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({item.count})
                    </span>
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(Number(item.total))}
                  </span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t pt-2 font-semibold">
                <span>Total Income</span>
                <span>{formatCurrency(totalIncomeNum)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expense Breakdown */}
      {(reportType === "summary" || reportType === "expense") && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Expense Breakdown</h2>
          {data.expenseByCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No expenses recorded in this period.
            </p>
          ) : (
            <div className="space-y-2">
              {data.expenseByCategory.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {item.category.replace("_", " ")}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({item.count})
                    </span>
                  </span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(Number(item.total))}
                  </span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t pt-2 font-semibold">
                <span>Total Expenses</span>
                <span className="text-red-600">
                  {formatCurrency(totalExpenseNum)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Transactions List */}
      {data.transactions.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="No transactions"
          description="No transactions found in this period."
        />
      ) : (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground">Recent Transactions in Period</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{formatDate(tx.date)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {tx.receiptNumber || "—"}
                    </TableCell>
                    <TableCell>{tx.type.replace("_", " ")}</TableCell>
                    <TableCell>
                      {tx.member
                        ? `${tx.member.firstName} ${tx.member.lastName}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {PAYMENT_METHOD_LABELS[tx.paymentMethod] ||
                        tx.paymentMethod}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-xs text-muted-foreground">
                      {tx.notes || "—"}
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
                {/* Totals Row */}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={6}>Net Income</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(netIncomeNum)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
