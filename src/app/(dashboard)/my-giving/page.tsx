import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Heart, TrendingUp, Calendar } from "lucide-react";
import { parsePageParams, pageMeta } from "@/lib/pagination";
import { PaginationBar } from "@/components/shared/pagination-bar";

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
    render: (tx) => tx.paymentMethod.replace("_", " "),
  },
  {
    key: "receiptNumber",
    label: "Receipt",
    render: (tx) => tx.receiptNumber || "—",
  },
];

export default async function MyGivingPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; pageSize?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = searchParams ? await searchParams : {};
  const { page, pageSize, skip, take } = parsePageParams(params, { defaultSize: 20 });

  const where = { memberId: session.user.id, type: { not: "EXPENSE" as const } };

  const [transactions, aggregate, thisYearAggregate, total] = await Promise.all([
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
        date: { gte: new Date(new Date().getFullYear(), 0, 1) },
      },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.count({ where }),
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
