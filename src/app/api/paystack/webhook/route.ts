import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { formatReceiptNumber } from "@/lib/utils";

export async function POST(request: Request) {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  // Verify Paystack signature
  const headersList = await headers();
  const signature = headersList.get("x-paystack-signature");
  const body = await request.text();

  const hash = crypto
    .createHmac("sha512", paystackSecretKey)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const data = event.data;
    const metadata = data.metadata || {};
    const amountInNaira = data.amount / 100;

    // Check if transaction already recorded (idempotency)
    const existing = await prisma.financialTransaction.findFirst({
      where: { paystackRef: data.reference },
    });
    if (existing) {
      return NextResponse.json({ message: "Already processed" });
    }

    // Generate receipt number
    const year = new Date().getFullYear();
    const prefix = `AG-${year}-`;
    const lastTx = await prisma.financialTransaction.findFirst({
      where: { receiptNumber: { startsWith: prefix } },
      orderBy: { receiptNumber: "desc" },
      select: { receiptNumber: true },
    });
    const lastSeq = lastTx?.receiptNumber
      ? parseInt(lastTx.receiptNumber.slice(-5), 10)
      : 0;
    const receiptNumber = formatReceiptNumber(year, lastSeq + 1);

    // Resolve member if provided
    const memberId = metadata.memberId || null;

    // Find a system user for recordedById (first SUPER_ADMIN)
    const systemUser = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      select: { id: true },
    });

    if (!systemUser) {
      console.error("No system user found for Paystack webhook recording");
      return NextResponse.json({ error: "System error" }, { status: 500 });
    }

    const type = metadata.type || "DONATION";
    const category = metadata.offeringCategory || "GENERAL";

    await prisma.financialTransaction.create({
      data: {
        type,
        category,
        amount: amountInNaira,
        currency: "NGN",
        paymentMethod: "ONLINE",
        date: new Date(data.paid_at || new Date()),
        receiptNumber,
        paystackRef: data.reference,
        memberId,
        recordedById: systemUser.id,
        notes: `Online payment via Paystack. Email: ${data.customer?.email || "N/A"}`,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "PAYSTACK_PAYMENT",
        entity: "FinancialTransaction",
        entityId: data.reference,
        details: JSON.stringify({
          amount: amountInNaira,
          type,
          email: data.customer?.email,
          reference: data.reference,
        }),
        userId: systemUser.id,
      },
    });
  }

  return NextResponse.json({ message: "OK" });
}
