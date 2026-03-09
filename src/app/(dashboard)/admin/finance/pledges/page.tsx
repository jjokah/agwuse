import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { HandCoins } from "lucide-react";

export const metadata: Metadata = {
  title: "Pledges",
};

export default async function PledgesPage() {
  await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);

  const pledges = await prisma.pledge.findMany({
    include: { member: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
  });

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    FULFILLED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pledges</h1>

      {pledges.length === 0 ? (
        <EmptyState
          icon={<HandCoins />}
          title="No pledges"
          description="Pledges will appear here once created."
        />
      ) : (
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

                return (
                  <TableRow key={pledge.id}>
                    <TableCell className="font-medium">
                      {pledge.title}
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
                        className={statusColor[pledge.status] || ""}
                        variant="outline"
                      >
                        {pledge.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(pledge.endDate)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
