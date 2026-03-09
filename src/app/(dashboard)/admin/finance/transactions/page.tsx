import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PlusCircle, Receipt } from "lucide-react";

export const metadata: Metadata = {
  title: "Transactions",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    method?: string;
    from?: string;
    to?: string;
    q?: string;
  }>;
}) {
  await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);
  const { type, method, from, to, q } = await searchParams;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (method) where.paymentMethod = method;
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  if (q) {
    where.OR = [
      { receiptNumber: { contains: q, mode: "insensitive" } },
      { member: { firstName: { contains: q, mode: "insensitive" } } },
      { member: { lastName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const transactions = await prisma.financialTransaction.findMany({
    where,
    include: {
      member: { select: { firstName: true, lastName: true } },
      recordedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Link
          href="/admin/finance/transactions/new"
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <PlusCircle className="size-4" />
          New Transaction
        </Link>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <Input name="q" placeholder="Search receipt# or name..." defaultValue={q || ""} className="w-56" />
        <select name="type" defaultValue={type || ""} className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="">All Types</option>
          <option value="TITHE">Tithe</option>
          <option value="OFFERING">Offering</option>
          <option value="DONATION">Donation</option>
          <option value="PLEDGE_PAYMENT">Pledge Payment</option>
          <option value="EXPENSE">Expense</option>
        </select>
        <select name="method" defaultValue={method || ""} className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="">All Methods</option>
          <option value="CASH">Cash</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="POS">POS</option>
          <option value="ONLINE">Online</option>
        </select>
        <Input name="from" type="date" defaultValue={from || ""} className="w-40" />
        <Input name="to" type="date" defaultValue={to || ""} className="w-40" />
        <button type="submit" className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Filter
        </button>
      </form>

      {transactions.length === 0 ? (
        <EmptyState
          icon={<Receipt />}
          title="No transactions found"
          description="Record your first transaction or adjust your filters."
        />
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
                  <TableCell>{tx.paymentMethod.replace("_", " ")}</TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      tx.type === "EXPENSE" ? "text-red-600" : ""
                    }`}
                  >
                    {formatCurrency(Number(tx.amount))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
