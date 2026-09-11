import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { parsePageParams, pageMeta } from "@/lib/pagination";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { FilterSelect, FilterSubmit } from "@/components/shared/filter-select";
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
import { VoidTransactionDialog } from "@/components/finance/void-dialog";
import type { TransactionType, PaymentMethod, Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Transactions",
};

const TYPE_OPTIONS = [
  { value: "TITHE", label: "Tithe" },
  { value: "OFFERING", label: "Offering" },
  { value: "DONATION", label: "Donation" },
  { value: "PLEDGE_PAYMENT", label: "Pledge Payment" },
  { value: "EXPENSE", label: "Expense" },
];

const METHOD_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "POS", label: "POS" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "ONLINE", label: "Online" },
];

export default async function FinanceTransactionsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    type?: string;
    method?: string;
    from?: string;
    to?: string;
    q?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);
  const params = searchParams ? await searchParams : {};
  const { type, method, from, to, q } = params;
  const { page, pageSize, skip, take } = parsePageParams(params);

  const where: Prisma.FinancialTransactionWhereInput = {};
  if (type) where.type = type as TransactionType;
  if (method) where.paymentMethod = method as PaymentMethod;

  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
    };
  }

  if (q) {
    where.OR = [
      { receiptNumber: { contains: q, mode: "insensitive" } },
      { member: { firstName: { contains: q, mode: "insensitive" } } },
      { member: { lastName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.financialTransaction.findMany({
      where,
      include: {
        member: { select: { firstName: true, lastName: true } },
        recordedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: "desc" },
      skip,
      take,
    }),
    prisma.financialTransaction.count({ where }),
  ]);

  const meta = pageMeta({ totalItems: total, page, pageSize });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Link
          href="/finance/record"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <PlusCircle className="size-4" />
          Record Transaction
        </Link>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-center gap-3">
        <Input
          name="q"
          placeholder="Search by receipt or name..."
          defaultValue={q || ""}
          className="w-56"
        />
        <FilterSelect
          name="type"
          placeholder="All Types"
          defaultValue={type || ""}
          options={TYPE_OPTIONS}
        />
        <FilterSelect
          name="method"
          placeholder="All Methods"
          defaultValue={method || ""}
          options={METHOD_OPTIONS}
        />
        <Input
          name="from"
          type="date"
          defaultValue={from || ""}
          className="w-40"
          aria-label="From date"
        />
        <Input
          name="to"
          type="date"
          defaultValue={to || ""}
          className="w-40"
          aria-label="To date"
        />
        <FilterSubmit text="Filter" />
      </form>

      {transactions.length === 0 ? (
        <EmptyState
          icon={<Receipt />}
          title="No transactions found"
          description="Record your first transaction or adjust your filters."
        />
      ) : (
        <div className="space-y-4">
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className={tx.voidedAt ? "opacity-60 bg-muted/30" : ""}>
                    <TableCell>{formatDate(tx.date)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {tx.receiptNumber || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={tx.type === "EXPENSE" ? "destructive" : "outline"}>
                          {tx.type.replace("_", " ")}
                        </Badge>
                        {tx.voidedAt && (
                          <Badge variant="destructive" className="text-[10px] uppercase">
                            Voided
                          </Badge>
                        )}
                      </div>
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/api/finance/receipts/${tx.id}`}
                          download
                          title="Download Receipt PDF"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-xs font-medium text-foreground hover:bg-muted"
                        >
                          <Receipt className="size-3.5" />
                        </a>
                        {!tx.voidedAt && (
                          <VoidTransactionDialog
                            transactionId={tx.id}
                            receiptNumber={tx.receiptNumber}
                            amount={formatCurrency(Number(tx.amount))}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationBar
            meta={meta}
            basePath="/finance/transactions"
            searchParams={params}
          />
        </div>
      )}
    </div>
  );
}
