import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildReceiptPDFBuffer } from "@/lib/pdf";
import { getChurchInfo } from "@/lib/settings";
import { formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/finance/labels";

const FINANCE_ROLES = new Set(["FINANCE", "ADMIN", "SUPER_ADMIN"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // DB-validated session: current role/status, not the (up to 60s old) JWT claims
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const tx = await prisma.financialTransaction.findUnique({
    where: { id },
    include: {
      member: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!tx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const isFinanceOrAdmin = FINANCE_ROLES.has(session.user.role);
  const isOwner = tx.memberId === session.user.id;

  if (!isFinanceOrAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // A voided transaction must never produce a valid-looking official receipt
  if (tx.voidedAt) {
    return NextResponse.json(
      { error: "This transaction has been voided; no receipt can be issued." },
      { status: 409 },
    );
  }

  if (tx.type === "EXPENSE") {
    return NextResponse.json(
      { error: "Receipts are only issued for income transactions." },
      { status: 400 },
    );
  }

  const churchInfo = await getChurchInfo();
  const memberName = tx.member
    ? `${tx.member.firstName} ${tx.member.lastName}`.trim()
    : "Anonymous Donor";

  const pdfBuffer = buildReceiptPDFBuffer(
    {
      receiptNumber: tx.receiptNumber || tx.id,
      date: formatDate(tx.date),
      memberName,
      type: TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type,
      amount: Number(tx.amount),
      paymentMethod: PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod,
      notes: tx.notes || undefined,
    },
    churchInfo
  );

  const filename = `receipt-${tx.receiptNumber || tx.id}.pdf`;

  return new NextResponse(Buffer.from(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
