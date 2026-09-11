import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildReceiptPDFBuffer } from "@/lib/pdf";
import { getChurchInfo } from "@/lib/settings";
import { formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
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

  const role = session.user.role;
  const isFinanceOrAdmin = ["FINANCE", "ADMIN", "SUPER_ADMIN"].includes(role);
  const isOwner = tx.memberId === session.user.id;

  if (!isFinanceOrAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      type: tx.type,
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
    },
  });
}
