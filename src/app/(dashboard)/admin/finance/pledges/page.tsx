import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { HandCoins, PlusCircle } from "lucide-react";
import type { PledgeStatus, Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Pledges",
};

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "FULFILLED", label: "Fulfilled" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default async function PledgesPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; page?: string; pageSize?: string }>;
}) {
  await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);
  const params = searchParams ? await searchParams : {};
  const { status } = params;
  const { page, pageSize, skip, take } = parsePageParams(params);

  const where: Prisma.PledgeWhereInput = {};
  if (status) where.status = status as PledgeStatus;

  const [pledges, total] = await Promise.all([
    prisma.pledge.findMany({
      where,
      include: { member: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.pledge.count({ where }),
  ]);

  const meta = pageMeta({ totalItems: total, page, pageSize });

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    FULFILLED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Pledges</h1>
        <Link
          href="/admin/finance/pledges/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <PlusCircle className="size-4" />
          New Pledge
        </Link>
      </div>

      {/* Filters */}
      <form className="flex items-center gap-3">
        <FilterSelect
          name="status"
          placeholder="All Status"
          defaultValue={status || ""}
          options={STATUS_OPTIONS}
        />
        <FilterSubmit text="Filter" />
      </form>

      {pledges.length === 0 ? (
        <EmptyState
          icon={<HandCoins />}
          title="No pledges"
          description="Pledges will appear here once created."
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pledges.map((pledge) => {
                  const progress =
                    Number(pledge.amount) > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (Number(pledge.amountPaid) / Number(pledge.amount)) * 100
                          )
                        )
                      : 0;

                  const isOverdue =
                    pledge.status === "ACTIVE" &&
                    pledge.endDate &&
                    new Date(pledge.endDate) < now;
                  const displayStatus = isOverdue ? "OVERDUE" : pledge.status;

                  return (
                    <TableRow key={pledge.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/finance/pledges/${pledge.id}`}
                          className="hover:underline font-semibold text-foreground"
                        >
                          {pledge.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {pledge.member.firstName} {pledge.member.lastName}
                      </TableCell>
                      <TableCell>{formatCurrency(Number(pledge.amount))}</TableCell>
                      <TableCell>
                        {formatCurrency(Number(pledge.amountPaid))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-brand-gold"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusColor[displayStatus] || ""}
                          variant="outline"
                        >
                          {displayStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {pledge.endDate ? formatDate(pledge.endDate) : "No due date"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/admin/finance/pledges/${pledge.id}`}
                          className="text-xs text-brand-gold-dark hover:underline font-medium"
                        >
                          View Details
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <PaginationBar
            meta={meta}
            basePath="/admin/finance/pledges"
            searchParams={params}
          />
        </div>
      )}
    </div>
  );
}
