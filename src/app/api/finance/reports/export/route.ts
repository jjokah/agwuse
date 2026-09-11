import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { parseDateRange } from "@/lib/date-params";
import { getFinanceReportData } from "@/lib/data/finance-reports";
import { toCsv } from "@/lib/csv";
import { buildReportPDFBuffer } from "@/lib/pdf";
import { formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const format = searchParams.get("format") === "pdf" ? "pdf" : "csv";

  const { from, to } = parseDateRange({ from: fromParam, to: toParam });
  const data = await getFinanceReportData(from, to, 2000);

  const fromStr = from.toISOString().split("T")[0];
  const toStr = to.toISOString().split("T")[0];
  const dateRangeLabel = `${fromStr} to ${toStr}`;

  const rows = data.transactions.map((tx) => ({
    Date: formatDate(tx.date),
    "Receipt #": tx.receiptNumber || "",
    Type: tx.type.replace("_", " "),
    Category: tx.category || "",
    Member: tx.member ? `${tx.member.firstName} ${tx.member.lastName}`.trim() : "",
    Method: PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod,
    Amount: Number(tx.amount).toFixed(2),
    Notes: tx.notes || "",
  }));

  if (format === "csv") {
    const csvContent = toCsv(rows);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="finance-report-${fromStr}-to-${toStr}.csv"`,
      },
    });
  }

  // Format === "pdf"
  const incomeByTypeMap: Record<string, number> = {};
  for (const item of data.incomeByType) {
    incomeByTypeMap[item.type] = Number(item.total);
  }

  const expenseByCategoryMap: Record<string, number> = {};
  for (const item of data.expenseByCategory) {
    expenseByCategoryMap[item.category] = Number(item.total);
  }

  const summary = {
    period: dateRangeLabel,
    totalIncome: Number(data.totalIncome),
    totalExpense: Number(data.totalExpense),
    netIncome: Number(data.netIncome),
    transactionCount: data.transactionCount,
    incomeByType: incomeByTypeMap,
    expenseByCategory: expenseByCategoryMap,
  };

  const pdfArrayBuffer = buildReportPDFBuffer(summary, rows);

  return new NextResponse(pdfArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="finance-report-${fromStr}-to-${toStr}.pdf"`,
    },
  });
}
