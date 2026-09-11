import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { parseDateRange } from "@/lib/date-params";
import { getFinanceReportData } from "@/lib/data/finance-reports";
import { ReportFilters } from "@/components/finance/report-filters";
import { ReportTables } from "@/components/finance/report-tables";
import { ExportButtons } from "@/components/finance/export-buttons";

export const metadata: Metadata = {
  title: "Financial Reports",
};

export default async function AdminFinanceReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    report?: string;
  }>;
}) {
  await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);
  const { from, to, report } = await searchParams;

  const { from: fromDate, to: toDate } = parseDateRange({ from, to });
  const data = await getFinanceReportData(fromDate, toDate);

  const fromStr = fromDate.toISOString().split("T")[0];
  const toStr = toDate.toISOString().split("T")[0];
  const reportType = report || "summary";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <ExportButtons from={fromStr} to={toStr} />
      </div>

      <ReportFilters from={fromStr} to={toStr} reportType={reportType} />

      <ReportTables data={data} reportType={reportType} />
    </div>
  );
}
