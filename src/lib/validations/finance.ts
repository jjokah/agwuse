import { z } from "zod/v4";
import { Prisma } from "@prisma/client";

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

export type TransactionInput = z.infer<typeof transactionSchema>;
export type PledgeInput = z.infer<typeof pledgeSchema>;
