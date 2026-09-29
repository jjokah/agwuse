import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { parseDateRange } from "@/lib/date-params";
import { getFinanceReportData } from "@/lib/data/finance-reports";
import { toCsv } from "@/lib/csv";
import { buildReportPDFBuffer } from "@/lib/pdf";
import { formatDate } from "@/lib/utils";
import { toLagosDateString } from "@/lib/tz";
import {
  OFFERING_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  TRANSACTION_TYPE_LABELS,
  expenseCategoryLabel,
} from "@/lib/finance/labels";
import { getChurchInfo } from "@/lib/settings";

/** CSV exports are complete up to this many rows; PDFs list fewer (they are for reading). */
const CSV_MAX_ROWS = 50_000;
const PDF_MAX_ROWS = 2_000;

const FINANCE_ROLES = new Set(["FINANCE", "ADMIN", "SUPER_ADMIN"]);

const CSV_COLUMNS = ["Date", "Receipt #", "Type", "Category", "Member", "Method", "Amount", "Notes"];

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!FINANCE_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const format = searchParams.get("format") === "pdf" ? "pdf" : "csv";

  const { from, to } = parseDateRange({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
  });
  const data = await getFinanceReportData(from, to, format === "csv" ? CSV_MAX_ROWS : PDF_MAX_ROWS);

  const fromStr = toLagosDateString(from);
  const toStr = toLagosDateString(to);
  const dateRangeLabel = `${fromStr} to ${toStr}`;

  const rows = data.transactions.map((tx) => ({
    Date: formatDate(tx.date),
    "Receipt #": tx.receiptNumber || "",
    Type: TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type,
    Category:
      tx.type === "EXPENSE"
        ? expenseCategoryLabel(tx.customCategory)
        : (tx.category && OFFERING_CATEGORY_LABELS[tx.category]) || "",
    Member: tx.member ? `${tx.member.firstName} ${tx.member.lastName}`.trim() : "",
    Method: PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod,
    Amount: Number(tx.amount).toFixed(2),
    Notes: tx.notes || "",
  }));

  const truncated = data.transactions.length < data.transactionCount;

  if (format === "csv") {
    const csvContent = toCsv(rows, CSV_COLUMNS);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="finance-report-${fromStr}-to-${toStr}.csv"`,
        ...(truncated ? { "X-Report-Truncated": String(data.transactions.length) } : {}),
      },
    });
  }

  // Format === "pdf"
  const incomeByType: Record<string, number> = {};
  for (const item of data.incomeByType) {
    incomeByType[TRANSACTION_TYPE_LABELS[item.type] ?? item.type] = Number(item.total);
  }

  const expenseByCategory: Record<string, number> = {};
  for (const item of data.expenseByCategory) {
    expenseByCategory[item.category] = Number(item.total);
  }

  const summary = {
    period: dateRangeLabel,
    totalIncome: Number(data.totalIncome),
    totalExpense: Number(data.totalExpense),
    netIncome: Number(data.netIncome),
    transactionCount: data.transactionCount,
    incomeByType,
    expenseByCategory,
    note: truncated
      ? `Transaction list shows the first ${data.transactions.length.toLocaleString()} of ${data.transactionCount.toLocaleString()} transactions; totals include all. Export CSV for the complete list.`
      : undefined,
  };

  const pdfArrayBuffer = buildReportPDFBuffer(summary, rows, await getChurchInfo());

  return new NextResponse(pdfArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="finance-report-${fromStr}-to-${toStr}.pdf"`,
    },
  });
}
