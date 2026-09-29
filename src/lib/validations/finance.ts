import { z } from "zod/v4";
import { Prisma } from "@prisma/client";
import { PUBLIC_GIVING_TYPES, PUBLIC_OFFERING_CATEGORIES } from "@/lib/finance/labels";

// Matches standard 2-decimal money strings or numbers up to 1 billion
export const moneyStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, { error: "Amount must be a valid currency value with up to 2 decimal places" })
  .refine(
    (val) => {
      const num = parseFloat(val);
      return num > 0 && num <= 1_000_000_000;
    },
    { error: "Amount must be greater than 0 and at most 1,000,000,000" },
  )
  .transform((val) => new Prisma.Decimal(val));

export const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/, {
    error: "Date must be a valid ISO date string (YYYY-MM-DD)",
  })
  .transform((val) => new Date(val))
  .refine((date) => !isNaN(date.getTime()), { error: "Invalid date value" });

export const TRANSACTION_TYPES = [
  "TITHE",
  "OFFERING",
  "DONATION",
  "PLEDGE_PAYMENT",
  "EXPENSE",
] as const;

export const OFFERING_CATEGORIES = [
  "GENERAL",
  "SPECIAL",
  "MISSION",
  "BUILDING_FUND",
  "WELFARE",
  "THANKSGIVING",
  "HARVEST",
  "FIRST_FRUIT",
  "OTHER",
] as const;

export const PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "POS",
  "MOBILE_MONEY",
  "ONLINE",
] as const;

export const transactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  amount: z
    .union([z.string(), z.number().transform((n) => n.toString())])
    .pipe(moneyStringSchema),
  paymentMethod: z.enum(PAYMENT_METHODS),
  date: isoDateSchema,
  memberId: z.string().optional().nullable(),
  offeringCategory: z.enum(OFFERING_CATEGORIES).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  referenceNumber: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  pledgeId: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  // Expenses never carry a member or pledge; the action strips them.
  if (data.type === "EXPENSE") return;
  if (data.pledgeId && !data.memberId) {
    ctx.addIssue({
      code: "custom",
      path: ["memberId"],
      message: "Select the member whose pledge this payment belongs to",
    });
  }
  if (data.type === "PLEDGE_PAYMENT" && !data.pledgeId) {
    ctx.addIssue({
      code: "custom",
      path: ["pledgeId"],
      message: "Select the pledge this payment should be applied to",
    });
  }
});

export const pledgeSchema = z.object({
  title: z.string().min(2, { error: "Title is required" }).max(200),
  amount: z
    .union([z.string(), z.number().transform((n) => n.toString())])
    .pipe(moneyStringSchema),
  startDate: isoDateSchema,
  endDate: isoDateSchema.optional().nullable(),
  memberId: z.string().min(1, { error: "Member is required" }),
});

/**
 * Public online giving (POST /api/paystack/initialize).
 * The intent type/category are written to the ledger verbatim by the webhook,
 * so internal types (EXPENSE, PLEDGE_PAYMENT) must never be accepted here.
 */
export const paystackInitializeSchema = z.object({
  email: z.email({ error: "Valid email is required" }),
  amount: z
    .union([z.string(), z.number().transform((n) => n.toString())])
    .pipe(moneyStringSchema),
  type: z.enum(PUBLIC_GIVING_TYPES, { error: "Unsupported giving type" }),
  offeringCategory: z.enum(PUBLIC_OFFERING_CATEGORIES).optional().nullable(),
  name: z.string().max(100).optional().nullable(),
});

/** Paystack transaction references: alphanumerics plus - . = _ (ours are AGW_<32 hex>). */
export const paystackReferenceSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9._=-]{6,100}$/, { error: "Invalid payment reference" });

export type TransactionInput = z.infer<typeof transactionSchema>;
export type PledgeInput = z.infer<typeof pledgeSchema>;
