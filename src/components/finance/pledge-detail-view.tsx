import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CancelPledgeButton } from "./cancel-pledge-button";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/labels";
import type { Pledge, User, FinancialTransaction } from "@prisma/client";

interface PledgeDetailViewProps {
  pledge: Pledge & {
    member: Pick<User, "id" | "firstName" | "lastName" | "email" | "phone">;
    payments: Pick<
      FinancialTransaction,
      "id" | "date" | "receiptNumber" | "paymentMethod" | "amount" | "notes" | "voidedAt"
    >[];
  };
  backPath: string;
}

export function PledgeDetailView({ pledge, backPath }: PledgeDetailViewProps) {
  const total = Number(pledge.amount);
  const paid = Number(pledge.amountPaid);
  const remaining = Math.max(0, total - paid);
  const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  const now = new Date();
  const isOverdue =
    pledge.status === "ACTIVE" && pledge.endDate && new Date(pledge.endDate) < now;
  const displayStatus = isOverdue ? "OVERDUE" : pledge.status;

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    FULFILLED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  const activePayments = (pledge.payments || []).filter((tx) => !tx.voidedAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={backPath}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Pledges
        </Link>
        {pledge.status === "ACTIVE" && (
          <CancelPledgeButton pledgeId={pledge.id} title={pledge.title} />
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pledge.title}</h1>
          <p className="text-muted-foreground">
            Member:{" "}
            <span className="font-medium text-foreground">
              {pledge.member.firstName} {pledge.member.lastName}
            </span>{" "}
            ({pledge.member.email})
          </p>
        </div>
        <Badge className={statusColor[displayStatus] || ""} variant="outline">
          {displayStatus}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Target Commitment</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(total)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Due: {pledge.endDate ? formatDate(pledge.endDate) : "No due date set"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Paid</CardDescription>
            <CardTitle className="text-2xl text-green-600 dark:text-green-400">
              {formatCurrency(paid)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-brand-gold"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-semibold">{progress}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Outstanding Balance</CardDescription>
            <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">
              {formatCurrency(remaining)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {remaining === 0 ? "Pledge fully satisfied" : "Remaining to fulfill"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Pledge Payments</CardTitle>
          <CardDescription>
            Record of all financial transactions credited towards this pledge commitment ({activePayments.length} payment{activePayments.length === 1 ? "" : "s"}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activePayments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No payments recorded against this pledge yet.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activePayments.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.date)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.receiptNumber || "—"}
                      </TableCell>
                      <TableCell>{PAYMENT_METHOD_LABELS[tx.paymentMethod] ?? tx.paymentMethod}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(Number(tx.amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={`/api/finance/receipts/${tx.id}`}
                          download
                          className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-xs text-foreground hover:bg-muted"
                        >
                          <Download className="size-3" />
                          PDF
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
