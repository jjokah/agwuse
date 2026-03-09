import { NextResponse } from "next/server";
import { z } from "zod/v4";

const schema = z.object({
  email: z.email({ error: "Valid email is required" }),
  amount: z.number().positive({ error: "Amount must be positive" }),
  type: z.enum(["TITHE", "OFFERING", "DONATION"]),
  offeringCategory: z.string().optional(),
  name: z.string().optional(),
  memberId: z.string().optional(),
});

export async function POST(request: Request) {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    return NextResponse.json(
      { error: "Payment service not configured" },
      { status: 503 }
    );
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const amountInKobo = Math.round(data.amount * 100);

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: data.email,
      amount: amountInKobo,
      currency: "NGN",
      metadata: {
        type: data.type,
        offeringCategory: data.offeringCategory || "GENERAL",
        name: data.name || "",
        memberId: data.memberId || "",
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/give?status=success`,
    }),
  });

  const result = await response.json();

  if (!result.status) {
    return NextResponse.json(
      { error: result.message || "Failed to initialize payment" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    authorization_url: result.data.authorization_url,
    access_code: result.data.access_code,
    reference: result.data.reference,
  });
}
