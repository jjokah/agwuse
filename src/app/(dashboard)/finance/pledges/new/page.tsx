import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PledgeForm } from "@/components/finance/pledge-form";

export const metadata: Metadata = {
  title: "New Pledge",
};

export default async function FinanceNewPledgePage() {
  await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/finance/pledges"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Pledges
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Record New Member Pledge</CardTitle>
          <CardDescription>
            Record a financial commitment from a church member towards a church fund or project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PledgeForm redirectPath="/finance/pledges" />
        </CardContent>
      </Card>
    </div>
  );
}
