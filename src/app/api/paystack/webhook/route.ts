import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { verifyPaystackSignature } from "@/lib/finance/paystack-signature";
import { recordPaystackPayment } from "@/lib/finance/paystack";

const chargePayloadSchema = z.object({
  event: z.string(),
  data: z.object({
    reference: z.string(),
    amount: z.number(),
    currency: z.string().default("NGN"),
    paid_at: z.string().optional(),
    customer: z
      .object({
        email: z.string().optional(),
      })
      .optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

export async function POST(request: Request) {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  // 1. Verify signature directly from request.headers for testability
  const signature = request.headers.get("x-paystack-signature");
  const rawBody = await request.text();

  if (!verifyPaystackSignature(rawBody, signature, paystackSecretKey)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 2. Parse and validate JSON
  let bodyJson: unknown;
  try {
    bodyJson = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Acknowledge events we don't process (transfers, refunds, subscriptions…) with 200
  // before validating the charge shape; a 4xx makes Paystack retry them indefinitely.
  const eventName =
    bodyJson && typeof bodyJson === "object" && "event" in bodyJson
      ? (bodyJson as { event?: unknown }).event
      : undefined;
  if (eventName !== "charge.success") {
    return NextResponse.json({ message: "Event ignored" });
  }

  const parsed = chargePayloadSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload shape" }, { status: 400 });
  }

  const event = parsed.data;

  // charge.success: record the payment (idempotent)
  const data = event.data;
  const amountInNaira = Math.round(data.amount) / 100;

  try {
    const recordResult = await recordPaystackPayment({
      reference: data.reference,
      amount: amountInNaira,
      currency: data.currency,
      paid_at: data.paid_at,
      customer: data.customer,
      metadata: data.metadata,
    });

    if (recordResult.status === "mismatch" || recordResult.status === "ignored") {
      return NextResponse.json({ message: recordResult.message });
    }

    return NextResponse.json({ message: "OK", receiptNumber: recordResult.receiptNumber });
  } catch (err: unknown) {
    console.error("Paystack webhook error:", err);
    // Only transient failures return 500
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
