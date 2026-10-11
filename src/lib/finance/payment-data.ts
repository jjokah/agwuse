import { z } from "zod/v4";
import { Prisma } from "@prisma/client";
import { paystackReferenceSchema } from "@/lib/validations/finance";

export const paymentDataSchema = z.object({
  reference: paystackReferenceSchema,
  amount: z.number().int().positive().max(100_000_000_000), // integer kobo
  currency: z.string(),
  paid_at: z.iso.datetime({ offset: true }).nullish(),
  customer: z.object({ email: z.email().optional() }).nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
});

export function toKobo(amount: Prisma.Decimal): number {
  const kobo = amount.mul(100);
  if (!kobo.isInteger() || !kobo.isPositive() || kobo.gt(Number.MAX_SAFE_INTEGER)) throw new Error("Invalid currency amount");
  return kobo.toNumber();
}
