import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { givingWhere } from "@/lib/finance/giving-filters";
import { toCsv } from "@/lib/csv";
import { TRANSACTION_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/finance/labels";
import { toLagosDateString } from "@/lib/tz";

export async function GET(request: NextRequest) {
  let session;
  try { session = await requireAuth(); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const where = givingWhere(session.user.id, request.nextUrl.searchParams);
  const rows = await prisma.$transaction(async (tx) => {
    if (await tx.financialTransaction.count({ where }) > 50_000) return null;
    return tx.financialTransaction.findMany({ where, select: { date: true, receiptNumber: true, type: true, paymentMethod: true, amount: true }, orderBy: [{ date: "asc" }, { id: "asc" }] });
  }, { isolationLevel: "RepeatableRead" });
  if (!rows) return NextResponse.json({ error: "Export exceeds 50,000 rows. Please narrow the date range." }, { status: 413 });
  return new NextResponse(toCsv(rows.map((tx) => ({
    Date: toLagosDateString(tx.date), "Receipt #": tx.receiptNumber ?? "",
    Type: TRANSACTION_TYPE_LABELS[tx.type], Method: PAYMENT_METHOD_LABELS[tx.paymentMethod], Amount: tx.amount.toFixed(2),
  })), ["Date", "Receipt #", "Type", "Method", "Amount"]), { headers: {
    "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="my-giving.csv"', "Cache-Control": "private, no-store",
  } });
}
