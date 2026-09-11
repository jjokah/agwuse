import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { moneyStringSchema, TRANSACTION_TYPES, OFFERING_CATEGORIES } from "@/lib/validations/finance";

const initializeSchema = z.object({
  email: z.email({ error: "Valid email is required" }),
  amount: z
    .union([z.string(), z.number().transform((n) => n.toString())])
    .pipe(moneyStringSchema),
  type: z.enum(TRANSACTION_TYPES),
  offeringCategory: z.enum(OFFERING_CATEGORIES).optional().nullable(),
  name: z.string().max(100).optional().nullable(),
});

export async function POST(request: Request) {
  const ip = await getClientIp();
  const limitCheck = await checkRateLimit("paystack_init", ip, 10, "60 s");
  if (!limitCheck.success) {
    return NextResponse.json(
      { error: "Too many payment initialization attempts. Please wait a minute." },
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

  const parsed = initializeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Resolve member from authenticated session if logged in and ACTIVE
  const session = await auth();
  const memberId =
    session?.user?.id && session.user.status === "ACTIVE"
      ? session.user.id
      : null;

  // Generate AGW reference and persist PaymentIntent
  const reference = `AGW_${randomUUID().replace(/-/g, "")}`;
  const amountInKobo = Math.round(Number(data.amount) * 100);

  await prisma.paymentIntent.create({
    data: {
      reference,
      memberId,
      email: data.email.toLowerCase().trim(),
      amount: data.amount,
      currency: "NGN",
      type: data.type,
      category: data.offeringCategory || "GENERAL",
      status: "PENDING",
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
      reference,
      metadata: {
        intentRef: reference,
        name: data.name || "",
      },
      callback_url: `${appUrl}/give/complete?reference=${reference}`,
    }),
  });

  const result = await response.json();

  if (!result.status || !result.data?.authorization_url) {
    return NextResponse.json(
      { error: result.message || "Failed to initialize payment with processor" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    authorization_url: result.data.authorization_url,
    access_code: result.data.access_code,
    reference,
  });
}
