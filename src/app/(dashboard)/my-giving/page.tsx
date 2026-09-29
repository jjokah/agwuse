import type { Metadata } from "next";
import { requirePageRole } from "@/lib/auth";
import { ALL_ROLES } from "@/lib/authz/roles";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable, type Column } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parsePageParams, pageMeta } from "@/lib/pagination";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Heart, TrendingUp, Calendar, Download, HandCoins } from "lucide-react";
import { startOfLagosYear } from "@/lib/tz";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/labels";

export const metadata: Metadata = {
  title: "My Giving",
};

type Transaction = {
  id: string;
  type: string;
  amount: number;
  date: Date;
  receiptNumber: string | null;
  paymentMethod: string;
};

const columns: Column<Transaction>[] = [
  {
    key: "date",
    label: "Date",
    render: (tx) => formatDate(tx.date),
  },
  {
    key: "type",
    label: "Type",
    render: (tx) => (
      <Badge variant="outline">{tx.type.replace("_", " ")}</Badge>
    ),
  },
  {
    key: "amount",
    label: "Amount",
    className: "text-right",
    render: (tx) => (
      <span className="font-semibold">{formatCurrency(tx.amount)}</span>
    ),
  },
  {
    key: "paymentMethod",
    label: "Method",
    render: (tx) => PAYMENT_METHOD_LABELS[tx.paymentMethod] ?? tx.paymentMethod,
  },
  {
    key: "receiptNumber",
    label: "Receipt #",
    render: (tx) => tx.receiptNumber || "—",
  },
  {
    key: "action",
    label: "Receipt PDF",
    className: "text-right",
    render: (tx) => (
      <a
        href={`/api/finance/receipts/${tx.id}`}
        download
        className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      >
        <Download className="size-3" />
        Download
      </a>
    ),
  },
];

export default async function MyGivingPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; pageSize?: string }>;
}) {
  const session = await requirePageRole(ALL_ROLES);

  const params = searchParams ? await searchParams : {};
  const { page, pageSize, skip, take } = parsePageParams(params, { defaultSize: 20 });

  const where = {
    memberId: session.user.id,
    type: { not: "EXPENSE" as const },
    voidedAt: null,
  };

  const [transactions, aggregate, thisYearAggregate, total, pledges] = await Promise.all([
    prisma.financialTransaction.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take,
    }),
    prisma.financialTransaction.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financialTransaction.aggregate({
      where: {
        ...where,
        date: { gte: startOfLagosYear() },
      },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.count({ where }),
    prisma.pledge.findMany({
      where: { memberId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const meta = pageMeta({ totalItems: total, page, pageSize });

  const totalGiving = aggregate._sum.amount
    ? Number(aggregate._sum.amount)
    : 0;
  const thisYearGiving = thisYearAggregate._sum.amount
    ? Number(thisYearAggregate._sum.amount)
    : 0;

  const data: Transaction[] = transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: Number(tx.amount),
    date: tx.date,
    receiptNumber: tx.receiptNumber,
    paymentMethod: tx.paymentMethod,
  }));

  const now = new Date();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Giving</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Giving"
          value={formatCurrency(totalGiving)}
          icon={<Heart />}
        />
        <StatCard
          title="This Year"
          value={formatCurrency(thisYearGiving)}
          icon={<TrendingUp />}
        />
        <StatCard
          title="Transactions"
          value={aggregate._count}
          icon={<Calendar />}
        />
      </div>

      {/* Pledges Card */}
      {pledges.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HandCoins className="size-5 text-brand-gold-dark" />
              <CardTitle className="text-lg">My Pledges</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {pledges.map((p) => {
                const totalAmt = Number(p.amount);
                const paidAmt = Number(p.amountPaid);
                const progress = totalAmt > 0 ? Math.min(100, Math.round((paidAmt / totalAmt) * 100)) : 0;
                const isOverdue =
                  p.status === "ACTIVE" && p.endDate && new Date(p.endDate) < now;
                const displayStatus = isOverdue ? "OVERDUE" : p.status;

                return (
                  <div key={p.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm">{p.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          Due: {p.endDate ? formatDate(p.endDate) : "No due date"}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          displayStatus === "FULFILLED"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : displayStatus === "OVERDUE"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : displayStatus === "CANCELLED"
                                ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        }
                      >
                        {displayStatus}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Paid: {formatCurrency(paidAmt)}</span>
                        <span className="font-medium">Target: {formatCurrency(totalAmt)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-brand-gold"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-right text-[11px] text-muted-foreground">{progress}% completed</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {data.length === 0 ? (
        <EmptyState
          icon={<Heart />}
          title="No giving records"
          description="Your giving history will appear here once transactions are recorded."
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={data}
            keyExtractor={(tx) => tx.id}
          />
          <PaginationBar
            meta={meta}
            basePath="/my-giving"
            searchParams={params}
          />
        </div>
      )}
    </div>
  );
}
