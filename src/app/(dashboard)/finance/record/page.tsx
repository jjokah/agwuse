import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionForm } from "@/app/(dashboard)/admin/finance/transactions/new/transaction-form";

export const metadata: Metadata = {
  title: "Record Transaction",
};

export default async function FinanceRecordPage() {
  await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);

  const [members, categories] = await Promise.all([
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    prisma.financialCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/finance"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Finance
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Record Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm
            members={members}
            categories={categories}
            redirectTo="/finance"
          />
        </CardContent>
      </Card>
    </div>
  );
}
