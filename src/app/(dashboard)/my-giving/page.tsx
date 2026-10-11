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
import { parsePageParams, resolvePage, pageMeta, hrefWithParams, type SearchParamsLike } from "@/lib/pagination";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Heart, TrendingUp, Calendar, Download, HandCoins } from "lucide-react";
import { startOfLagosYear } from "@/lib/tz";
import { givingWhere } from "@/lib/finance/giving-filters";
import { normalizeSearchParams } from "@/lib/search-params";
import { pledgeDisplayStatus } from "@/lib/finance/pledges";
import { DownloadButton } from "@/components/shared/download-button";
import { FilterSelect, FilterSubmit } from "@/components/shared/filter-select";
import { TRANSACTION_TYPES, PAYMENT_METHODS } from "@/lib/validations/finance";
import { PAYMENT_METHOD_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/finance/labels";

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
  searchParams?: Promise<SearchParamsLike>;
}) {
  const session = await requirePageRole(ALL_ROLES);

  const params = normalizeSearchParams(searchParams ? await searchParams : {});
  const where = givingWhere(session.user.id, params);
  const { transactions, aggregate, thisYearAggregate, total, pledges, page, pageSize } = await prisma.$transaction(async (tx) => {
    const total = await tx.financialTransaction.count({ where });
    const pagination = resolvePage(parsePageParams(params, { defaultSize: 20 }), total);
    const [transactions, aggregate, thisYearAggregate, pledges] = await Promise.all([
      tx.financialTransaction.findMany({ where, orderBy: [{ date: "desc" }, { id: "desc" }], skip: pagination.skip, take: pagination.take }),
      tx.financialTransaction.aggregate({ where, _sum: { amount: true }, _count: true }),
      tx.financialTransaction.aggregate({ where: { AND: [where, { date: { gte: startOfLagosYear() } }] }, _sum: { amount: true } }),
      tx.pledge.findMany({ where: { memberId: session.user.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
    ]);
    return { transactions, aggregate, thisYearAggregate, pledges, total, ...pagination };
  }, { isolationLevel: "RepeatableRead" });

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Giving</h1>
      <form className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">From<input type="date" name="from" defaultValue={params.from} className="block rounded-md border p-2" /></label>
        <label className="space-y-1 text-sm">To<input type="date" name="to" defaultValue={params.to} className="block rounded-md border p-2" /></label>
        <FilterSelect name="type" placeholder="All giving types" defaultValue={params.type} options={TRANSACTION_TYPES.filter((type) => type !== "EXPENSE").map((value) => ({ value, label: TRANSACTION_TYPE_LABELS[value] }))} />
        <FilterSelect name="method" placeholder="All methods" defaultValue={params.method} options={PAYMENT_METHODS.map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }))} />
        <FilterSubmit text="Filter" />
      </form>
      <DownloadButton href={hrefWithParams("/api/me/giving/export", params, { page: null, pageSize: null })}>Download CSV</DownloadButton>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Filtered Giving"
          value={formatCurrency(totalGiving)}
          icon={<Heart />}
        />
        <StatCard
          title="Filtered This Year"
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
                const displayStatus = pledgeDisplayStatus(p);

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
