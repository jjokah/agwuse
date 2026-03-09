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
    const amountInNaira = Math.round(data.amount) / 100;

    // Check if transaction already recorded (idempotency)
    const existing = await prisma.financialTransaction.findFirst({
      where: { paystackRef: data.reference },
    });
    if (existing) {
      return NextResponse.json({ message: "Already processed" });
    }

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

    // Retry loop to handle receipt number race conditions
    let retries = 3;
    while (retries > 0) {
      try {
        // Generate receipt number inside retry loop
        const year = new Date().getFullYear();
        const prefix = `AG-${year}-`;
        const lastTx = await prisma.financialTransaction.findFirst({
          where: { receiptNumber: { startsWith: prefix } },
          orderBy: { receiptNumber: "desc" },
          select: { receiptNumber: true },
        });
        const match = lastTx?.receiptNumber?.match(/-(\d{5})$/);
        const lastSeq = match ? parseInt(match[1], 10) : 0;
        const receiptNumber = formatReceiptNumber(year, lastSeq + 1);

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

        break; // Success — exit retry loop
      } catch (err: unknown) {
        const isUniqueViolation =
          err instanceof Error && err.message.includes("Unique constraint");
        if (isUniqueViolation && retries > 1) {
          retries--;
          continue;
        }
        console.error("Webhook transaction creation failed:", err);
        return NextResponse.json(
          { error: "Processing failed" },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ message: "OK" });
}
