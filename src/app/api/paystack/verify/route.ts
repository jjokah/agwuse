import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { recordPaystackPayment } from "@/lib/finance/paystack";
import { paystackReferenceSchema } from "@/lib/validations/finance";

const verifySchema = z.object({
  reference: paystackReferenceSchema,
});

export async function POST(request: Request) {
  const ip = await getClientIp();
  const limitCheck = await checkRateLimit("paystack_verify", ip, 20, "60 s");
  if (!limitCheck.success) {
    return NextResponse.json(
      { error: "Too many verification requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    return NextResponse.json(
      { error: "Payment service not configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { reference } = parsed.data;

  // Call Paystack verify endpoint
  let result;
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
        signal: AbortSignal.timeout(15_000),
      },
    );
    result = await response.json();
  } catch (err) {
    console.error("Paystack verify request failed:", err);
    return NextResponse.json(
      { error: "Could not reach the payment processor. If you were debited, your gift will still be recorded." },
      { status: 502 },
    );
  }

  if (!result.status || result.data?.status !== "success") {
    return NextResponse.json(
      { error: result.message || "Payment verification failed or payment not successful" },
      { status: 400 },
    );
  }

  const data = result.data;
  const amountInNaira = Math.round(Number(data.amount)) / 100;

  const recordResult = await recordPaystackPayment({
    reference: data.reference,
    amount: amountInNaira,
    currency: data.currency || "NGN",
    paid_at: data.paid_at,
    customer: data.customer,
    metadata: data.metadata,
  });

  if (recordResult.status === "mismatch") {
    return NextResponse.json(
      { error: "Payment details do not match the initialized intent" },
      { status: 400 },
    );
  }

  if (recordResult.status === "ignored") {
    return NextResponse.json(
      { error: recordResult.message },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    reference: data.reference,
    receiptNumber: recordResult.receiptNumber || null,
  });
}
